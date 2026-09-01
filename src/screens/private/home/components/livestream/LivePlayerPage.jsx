import { useEffect, useState, useRef, lazy, Suspense } from "react";
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

// How long a loading state may sit with nothing to interact with before it
// offers a way out.
//
// This page is a paid Google Ads landing page and it is the one route where
// HomeLayout renders neither the TopHeader (suppressed for /live) nor the footer
// (`footer: false` on the route). So while either of the loading states below is
// on screen there is not a single interactive element anywhere in the document —
// a tap in that window cannot do anything, whatever it lands on.
//
// It is not a narrow window either: InteractiveLiveStreaming is a 1,256 kB chunk
// (the Agora SDK), fetched after the live-list request resolves. Clarity has a
// session that arrived from a YouTube ad, waited through page load at 00:06,
// tapped once at 00:14 to no effect, and was gone by 00:15 — 15 seconds, one
// page, one click.
//
// Was five seconds, chosen against a session that gave up at 00:15. That set the
// bar too low: Clarity has since recorded a desktop visitor who clicked "Live"
// in the nav at 05:14 and hid the tab at 05:22 — the entire visit to this route
// was eight seconds, and it was the only click in a ten-minute session. A 5s
// gate leaves roughly three seconds of actionable screen in a visit that short,
// and the same user ID shows the pattern twice.
//
// 2.5s still clears a normal join: the live-list request and the Agora chunk are
// both kicked off together at the top of fetchLives, and a warm connection
// resolves them well inside a second, so the escape UI stays unseen in the
// common case. It only surfaces when the wait is already abnormal — which is
// exactly when the visitor is deciding whether to leave.
const LOADING_ESCAPE_MS = 2500;

/*
 * A loading state that grows an escape hatch if it outstays its welcome.
 *
 * The alternatives offered mirror what the "nobody is live" and load-failure
 * cards already do, and what LiveView's waiting screen does once connecting
 * times out: name the situation and give a route to an astrologer who can be
 * reached right now.
 */
const LiveLoadingGate = ({ message }) => {
  const [showEscape, setShowEscape] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShowEscape(true), LOADING_ESCAPE_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className={styles.gateWrap}>
      <div className={styles.gateLoading}>
        <PrimaryLoader fullscreen={false} message={message} />

        {showEscape && (
          <div className={styles.gateEscape}>
            <p className={styles.gateText}>
              Still loading — live video is a big download on a slow connection.
            </p>
            <div className={styles.gateActions}>
              <Link to="/astrologers" className={styles.gatePrimary}>
                Chat or call an astrologer now
              </Link>
              {/* A stalled chunk download can't be retried from here, so a full
                  reload is the honest remedy rather than a no-op retry button. */}
              <button
                type="button"
                className={styles.gateSecondary}
                onClick={() => window.location.reload()}
              >
                Reload the page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

    // Returned so callers can react when the check finishes — the manual
    // "Check again" button needs to know when to stop saying "Checking…".
    return getAstrologerLiveList().then((res) => {
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
      return liveList.length;
    }).catch(() => {
      // The failure used to be indistinguishable from "nobody is live": both
      // ended with an empty list and a screen that explained neither.
      if (!silent) {
        setLoadFailed(true);
        setIsLoading(false);
      }
      return null;
    });
  };

  // Argument-free wrapper — safe to hand directly to onClick. See fetchLives.
  const loadLives = () => {
    fetchLives();
  };

  /*
    Result of the last manual "Check again", so the button can report back.

    That button was `onClick={loadLives}`, i.e. a NON-silent refetch: it set
    isLoading, which unmounts the "Nobody is live right now" card and swaps in
    LiveLoadingGate. When the list came back empty again — the overwhelmingly
    common case, since that is why the card is on screen — the identical card
    returned. So the whole visible effect of the tap was a spinner flash
    resolving to the exact screen the user started on, with nothing stating that
    a check had run or what it found.

    Clarity recorded the predictable outcome: a mobile visitor from Google, on
    this page at 04:27, tapping "Check again" repeatedly. A person who cannot
    tell whether a button fired presses it again, and the heuristic scores a
    transient flash back to an identical DOM as a dead click.

    The re-check is now silent, so the card stays put instead of flickering, and
    the outcome is written next to the button. `seq` increments per check and
    keys the message, so a second tap that finds nothing new still remounts the
    line and replays its animation rather than rendering an identical string.
  */
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const checkSeqRef = useRef(0);

  const handleCheckAgain = () => {
    if (checking) return;
    setChecking(true);
    fetchLives({ silent: true })
      .then((count) => {
        checkSeqRef.current += 1;
        // A non-zero count unmounts this card entirely (the player takes over),
        // so the only outcomes worth wording are "still none" and "check failed".
        setCheckResult({
          seq: checkSeqRef.current,
          failed: count === null,
        });
      })
      .finally(() => setChecking(false));
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
    //return <LiveLoadingGate message="Finding live sessions…" />;
    return <LiveLoadingGate message="" />;
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
            {/* Never `disabled` while checking: a disabled button swallows the
                tap outright, which is the failure mode this whole change exists
                to remove. aria-busy states it instead, and handleCheckAgain
                ignores re-entry. */}
            <button
              type="button"
              className={styles.gatePrimary}
              onClick={handleCheckAgain}
              aria-busy={checking}
            >
              {checking ? "Checking…" : "Check again"}
            </button>
            <Link to="/astrologers" className={styles.gateSecondary}>
              See who&apos;s online
            </Link>
          </div>
          {/* Outcome of the tap, next to the button that made it — see
              handleCheckAgain. Keyed on seq so a repeat check replays. */}
          {checkResult && !checking && (
            <p
              key={checkResult.seq}
              className={styles.gateCheckResult}
              role="status"
            >
              {checkResult.failed
                ? "Couldn't reach the live list just now — check your connection and try again."
                : "Checked just now — still nobody live. We'll bring the stream up automatically the moment someone starts."}
            </p>
          )}
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
          the duration of both downloads. It is LiveLoadingGate rather than a
          bare loader because this is the longest of the two waits and, with no
          header and no footer on this route, a loader on its own leaves the page
          with nothing to interact with. */}
      <Suspense fallback={<LiveLoadingGate message="Starting the live player…" />}>
        <InteractiveLiveStreaming />
      </Suspense>
    </LiveListProvider>
  );
};

export default LivePlayerPage;
