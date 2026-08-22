import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { LiveListProvider } from "../../../../../context/LiveListContext";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";
import { restoreViewerSession, clearViewerSession } from "../../../../../utils/liveSessionStorage";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";
import { getAstrologerImageUrl } from "../../../../../utils/appImages";
import PrimaryLoader from "../../../../../component/UI/PrimaryLoader";
import styles from "./LivePlayerPage.module.scss";

// Lazy, because this module carries the Agora RTC SDK — a 1,226 kB chunk.
//
// It used to be a static import, which meant the chunk was part of *this* module
// and therefore downloaded before any of the code below could run. That is the
// worst case on /live, which is a paid Google Ads landing page: a visitor fetched
// the entry bundle and then ~1.2 MB of video SDK before this page could decide
// whether it had anything to play at all — including the "nobody is live" and
// load-failure cases, where the SDK is never used.
//
// Splitting it means those exits cost only this small module. Real viewers do not
// pay an extra round trip either: the import is kicked off alongside the
// live-list request, so it is usually resolved by the time it renders.
const importInteractiveLiveStreaming = () => import("./InteractiveLiveStreaming");
const InteractiveLiveStreaming = lazy(importInteractiveLiveStreaming);

// How often to re-check for streams while the "nobody is live" card is showing.
// Only ever runs on that state and only while the tab is visible, so this is a
// handful of requests per idle visitor rather than a background poll for everyone.
const EMPTY_STATE_POLL_MS = 30000;

const LivePlayerPage = () => {
  const { channelId } = useParams();
  const [lives, setLives] = useState([]);
  const [autoStartIndex, setAutoStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  /*
    Guests may watch live streams, so there is no login gate here.

    `silent` is for the background refreshes below (the poll and the socket
    listener): it skips the loading and failure state changes so a refresh behind
    the "Nobody is live right now" card does not replace that card with a spinner,
    and a transient failure does not swap a valid empty state for an error one.

    Note the deliberate `loadLives` wrapper underneath. This function cannot be
    passed straight to `onClick`, because React would hand the click event in as
    `options` and `options.silent` on a SyntheticEvent is undefined-but-the-object-
    is-truthy territory — easy to get wrong later. The wrapper takes no arguments,
    so button handlers and the mount effect can never leak one in.
  */
  const fetchLives = ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);

    // Start fetching the Agora chunk alongside the live list rather than after
    // it, so splitting the player out does not add a round trip for viewers who
    // will actually reach it.
    importInteractiveLiveStreaming();

    const savedSession = restoreViewerSession();

    getAstrologerLiveList().then((res) => {
      const data = res.data?.data || [];

      // dedupe channels
      const map = {};
      data.forEach((item) => {
        if (
          !map[item.channel] ||
          map[item.channel].lastActive < item.lastActive
        ) {
          map[item.channel] = item;
        }
      });

      let liveList = Object.values(map).filter((l) => l.astrologer);

      // Determine which channel to auto-start on:
      // 1. URL param (direct link / new tab) — always a channel/room ID
      // 2. Then saved session (reconnect after refresh)
      let targetChannel = null;

      if (channelId) {
        targetChannel = channelId;
        const existsInList = liveList.some((l) => l.channel === channelId);
        if (!existsInList) {
          // Channel not in API list yet — add placeholder so player can attempt to join
          liveList = [{ channel: channelId }, ...liveList];
        }
      } else if (savedSession?.channel) {
        // Only restore saved session if the channel is still live (exists in API response)
        const existsInList = liveList.some(
          (l) => l.channel === savedSession.channel
        );
        if (existsInList) {
          targetChannel = savedSession.channel;
        } else {
          // Saved channel is no longer live — clear stale session so useLiveStreaming
          // fetches a fresh viewer token instead of trying reconnect-token
          clearViewerSession();
        }
      }

      if (targetChannel) {
        const idx = liveList.findIndex((l) => l.channel === targetChannel);
        if (idx >= 0) {
          setAutoStartIndex(idx);
        }
      }

      setLives(liveList);
      setLoadFailed(false);
      if (!silent) setIsLoading(false);
    }).catch(() => {
      // The failure used to be indistinguishable from "nobody is live": both
      // ended with an empty list and a screen that explained neither.
      if (!silent) {
        setLoadFailed(true);
        setIsLoading(false);
      }
    });
  };

  // Argument-free wrapper — safe to hand directly to onClick. See fetchLives.
  const loadLives = () => {
    fetchLives();
  };

  useEffect(() => {
    fetchLives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  /*
    Re-check for streams while the empty state is on screen.

    The empty card told the visitor to "check back shortly" and gave them a
    manual "Check again" button, and that was the only way the page could ever
    learn that somebody had gone live. So they check by hand — one session shows
    a visitor bouncing between the homepage and this page for an hour and a half
    across 17 page loads, with long idle gaps between clicks. They were polling
    us manually.

    Runs only while there is genuinely nothing to watch, so it never competes
    with the Agora player: the moment the list comes back non-empty this effect
    tears the interval down, and it is skipped entirely on the loading and
    failure states (the failure state has its own retry, which the visitor should
    stay in control of). Silent, so the card does not flicker.
  */
  useEffect(() => {
    if (isLoading || loadFailed || lives.length > 0) return undefined;

    const id = setInterval(() => {
      // Don't poll a page nobody is looking at — this state can sit open for a
      // very long time, which is the whole reason it exists.
      if (document.visibilityState === "visible") {
        fetchLives({ silent: true });
      }
    }, EMPTY_STATE_POLL_MS);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadFailed, lives.length]);

  /*
    Same job as the poll above, but instant.

    The poll is the safety net — it also covers a dropped socket — while this
    picks the stream up the moment an astrologer goes live instead of up to 30s
    later. `useAstrologerStatusSocket` (mounted once in App) re-dispatches the
    socket event on `window`, so this needs no second socket connection.

    Attached under exactly the same guard as the poll, so it only exists while
    there is nothing to watch: while a stream is on screen LiveStreamingContainer
    handles new sessions itself, and refetching here would yank the reel out from
    under the viewer. Silent for the same reason the poll is.
  */
  useEffect(() => {
    if (isLoading || loadFailed || lives.length > 0) return undefined;

    const onLiveStatus = (event) => {
      if (event?.detail?.status !== "started") return;
      fetchLives({ silent: true });
    };

    window.addEventListener("live:astrologer_status", onLiveStatus);
    return () => window.removeEventListener("live:astrologer_status", onLiveStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadFailed, lives.length]);

  /*
   * Every exit from this page used to be `return null`, i.e. a blank white page
   * under the global header, and there were three of them in a row: the
   * live-list fetch and two lazy chunk boundaries sharing a
   * `<Suspense fallback={null}>` (the Agora player is 1,256 kB and
   * LiveStreamingContainer another 74 kB). On a cold visit from an ad that is
   * seconds of nothing to look at, and any click landing in that window hits the
   * page background — a dead click with nothing to attribute it to.
   *
   * Each state below now renders something, and every one of them offers a way
   * out.
   */

  if (isLoading) {
    return (
      <div className={styles.gateWrap}>
        <PrimaryLoader fullscreen={false} message="Finding live sessions…" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Couldn&apos;t load live sessions</h1>
          <p className={styles.gateText}>
            The list didn&apos;t come through. This is usually a connection hiccup.
          </p>
          <div className={styles.gateActions}>
            <button type="button" className={styles.gatePrimary} onClick={loadLives}>
              Try again
            </button>
            <Link to="/astrologers" className={styles.gateSecondary}>
              Browse astrologers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /*
   * No streams at all. This case used to fall straight through to the player,
   * which mounted the Agora client and LiveView with `channel: undefined` and
   * tried to join nothing — so an empty list rendered as a stalled black player
   * rather than as an answer. LiveStreamingContainer only ever guards
   * `lives.length > 1` (for the up/down nav), never zero.
   */
  if (lives.length === 0) {
    return (
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Nobody is live right now</h1>
          <p className={styles.gateText}>
            Live sessions run through the day. Check back shortly, or start a chat or
            call with an astrologer who is online now.
          </p>
          <div className={styles.gateActions}>
            <button type="button" className={styles.gatePrimary} onClick={loadLives}>
              Check again
            </button>
            <Link to="/astrologers" className={styles.gateSecondary}>
              See who&apos;s online
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LiveListProvider
      lives={lives.map((l) => ({
        channel: l.channel,
        // userName-first display name (helper falls back to firstName + lastName).
        astrologerName: getAstrologerDisplayName(l.astrologer),
        // Keep the raw userName too so downstream consumers that rebuild an
        // astrologer object don't lose it.
        userName: l.astrologer?.userName || "",
        astrologerId: l.astrologer?._id,
        rating: l.astrologer?.rating,
        expertise: l.astrologer?.expertise,
        // Resolved once here so every downstream consumer of the live list
        // (LiveStreamingContainer's stream-ended card, LiveListContext readers)
        // gets a sized variant instead of the unresized original. The largest
        // surface that reads this is 60px, so `small` (100x125).
        //
        // Falls back through profileImgUrl -> imageUrl -> gendered default, so
        // this is unchanged when the live-list projection omits profileImages.
        imageUrl: getAstrologerImageUrl(l.astrologer, "small"),
        audioCallRate: l.astrologer?.price?.audioRate?.amount,
        videoCallRate: l.astrologer?.price?.videoCallRate?.amount,
        uid: l.uid,
        startedAt: l.startedAt,
        isOnPrivateCall: !!l.isOnPrivateCall,
        privateCallType: l.privateCallType || null,
      }))}
      autoStartIndex={autoStartIndex}
    >
      {/* Local boundary, so a suspend does not bubble to HomeLayout's
          <Suspense fallback={<CircleSpinner />}> and blank the whole layout.
          The fallback shows a loader rather than null: two lazy chunks resolve
          behind this boundary (the Agora player at 1,256 kB, then
          LiveStreamingContainer), and on a cold visit that was a blank page for
          the duration of both downloads. */}
      <Suspense
        fallback={
          <div className={styles.gateWrap}>
            <PrimaryLoader fullscreen={false} message="Starting the live player…" />
          </div>
        }
      >
        <InteractiveLiveStreaming />
      </Suspense>
    </LiveListProvider>
  );
};

export default LivePlayerPage;
