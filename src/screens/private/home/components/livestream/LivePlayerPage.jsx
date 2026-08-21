import { useCallback, useEffect, useRef, useState, lazy, Suspense } from "react";
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

const LivePlayerPage = () => {
  const { channelId } = useParams();
  const [lives, setLives] = useState([]);
  const [autoStartIndex, setAutoStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Guests may watch live streams, so there is no login gate here. Kept as a
  // named callback (rather than inlined in the effect) so the "Try again" /
  // "Check again" buttons and the auto-resume listener below can all re-run it.
  const loadLives = useCallback(() => {
    setIsLoading(true);

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
      setIsLoading(false);
    }).catch(() => {
      // The failure used to be indistinguishable from "nobody is live": both
      // ended with an empty list and a screen that explained neither.
      setLoadFailed(true);
      setIsLoading(false);
    });
  }, [channelId]);

  useEffect(loadLives, [loadLives]);

  /*
    Auto-resume when an astrologer goes live while nothing is playing.

    The "Nobody is live right now" card below used to be a dead end until the
    visitor tapped "Check again" — the reel's own live:session_started handling
    lives inside LiveStreamingContainer, which isn't mounted when the list is
    empty. So a viewer who sat through the last astrologer signing off had to
    poll by hand.

    `useAstrologerStatusSocket` (mounted once in App) re-dispatches the socket
    event on `window`, so this needs no second socket connection.

    Guarded on the list actually being empty: while a stream is on screen the
    container handles new sessions itself, and re-fetching here would yank the
    reel out from under the viewer.
  */
  const livesRef = useRef(lives);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  useEffect(() => {
    const onLiveStatus = (event) => {
      if (event?.detail?.status !== "started") return;
      if (livesRef.current.length > 0) return;
      loadLives();
    };

    window.addEventListener("live:astrologer_status", onLiveStatus);
    return () => window.removeEventListener("live:astrologer_status", onLiveStatus);
  }, [loadLives]);

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
