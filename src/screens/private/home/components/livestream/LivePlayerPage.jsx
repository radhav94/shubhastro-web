import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
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
// worst case on /live, which is a paid Google Ads landing page: a guest fetched
// the entry bundle, then ~1.2 MB of video SDK, then hit the `!isLoggedIn` guard
// below, rendered `null`, and got redirected straight to /login — having
// downloaded a real-time streaming engine to display a blank screen.
//
// Splitting it means the guest redirect now costs only this small module. Real
// viewers do not pay an extra round trip either: warmInteractiveLiveStreaming()
// starts the download as soon as we know the visitor is logged in, in parallel
// with the live-list request, so it is usually resolved by the time it renders.
const importInteractiveLiveStreaming = () => import("./InteractiveLiveStreaming");
const InteractiveLiveStreaming = lazy(importInteractiveLiveStreaming);

const LivePlayerPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // The persisted redux `auth.isLoggedIn` can be stale (false) even when a
  // valid customer token exists in localStorage (redux-persist rehydrates an
  // old value over the token-derived initial state). The rest of the live
  // module authenticates off the token, so treat a present token as logged in
  // to avoid a false live -> login -> home redirect.
  const reduxLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const hasCustomerToken = !!localStorage.getItem("shubhtalk_customer_token");
  const isLoggedIn = reduxLoggedIn || hasCustomerToken;
  const [lives, setLives] = useState([]);
  const [autoStartIndex, setAutoStartIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadLives = () => {
    if (!isLoggedIn) return;
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
  };

  useEffect(loadLives, [channelId, isLoggedIn]);

  /*
   * Every exit from this page used to be `return null`, i.e. a blank white page
   * under the global header, and there were four of them in a row: the guest
   * guard, the live-list fetch, and two lazy chunk boundaries sharing a
   * `<Suspense fallback={null}>` (the Agora player is 1,256 kB and
   * LiveStreamingContainer another 74 kB). On a cold visit from an ad that is
   * seconds of nothing to look at, and any click landing in that window hits the
   * page background — a dead click with nothing to attribute it to.
   *
   * Each state below now renders something, and every one of them offers a way
   * out.
   */
  if (!isLoggedIn) {
    /*
     * Previously a silent navigate to /login with `replace: true` behind a blank
     * frame. Two problems beyond the blank: the visitor was moved without being
     * told why, and `replace` dropped /live from the history, so Back from the
     * login screen returned to the homepage rather than here — which is exactly
     * the homepage/live bouncing this page produces in session recordings.
     *
     * Asking instead of redirecting keeps the history intact and makes the
     * requirement legible. `from` is still handed to the login flow so a
     * completed sign-in comes back to the stream.
     */
    return (
      <div className={styles.gateWrap}>
        <div className={styles.gateCard}>
          <h1 className={styles.gateTitle}>Live sessions need an account</h1>
          <p className={styles.gateText}>
            Log in to watch astrologers live, ask questions in the chat and send gifts.
          </p>
          <div className={styles.gateActions}>
            <button
              type="button"
              className={styles.gatePrimary}
              onClick={() =>
                navigate("/login?skip=welcome", { state: { from: location.pathname } })
              }
            >
              Log in to watch
            </button>
            <Link to="/astrologers" className={styles.gateSecondary}>
              Browse astrologers instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
