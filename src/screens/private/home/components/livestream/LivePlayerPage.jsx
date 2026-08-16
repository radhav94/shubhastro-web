import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { LiveListProvider } from "../../../../../context/LiveListContext";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";
import { restoreViewerSession, clearViewerSession } from "../../../../../utils/liveSessionStorage";
import { getAstrologerDisplayName } from "../../../../../utils/helper/string.utils";

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

  // Redirect guest users to login
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login?skip=welcome", {
        state: { from: location.pathname },
        replace: true,
      });
    }
  }, [isLoggedIn, navigate, location.pathname]);

  useEffect(() => {
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
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [channelId, isLoggedIn]);

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return null;
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
        imageUrl: l.astrologer?.profileImgUrl || l.astrologer?.imageUrl,
        audioCallRate: l.astrologer?.price?.audioRate?.amount,
        videoCallRate: l.astrologer?.price?.videoCallRate?.amount,
        uid: l.uid,
        startedAt: l.startedAt,
        isOnPrivateCall: !!l.isOnPrivateCall,
        privateCallType: l.privateCallType || null,
      }))}
      autoStartIndex={autoStartIndex}
    >
      {/* Local boundary with a null fallback: matches what this page already
          renders while isLoading, and keeps a suspend from bubbling up to
          HomeLayout's <Suspense fallback={<CircleSpinner />}> and blanking the
          whole layout. */}
      <Suspense fallback={null}>
        <InteractiveLiveStreaming />
      </Suspense>
    </LiveListProvider>
  );
};

export default LivePlayerPage;
