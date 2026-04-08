import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import InteractiveLiveStreaming from "./InteractiveLiveStreaming";
import { LiveListProvider } from "../../../../../context/LiveListContext";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";
import { restoreViewerSession } from "../../../../../utils/liveSessionStorage";

const LivePlayerPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useSelector((state) => state.auth);
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

      console.log("mappppp", map);

      let liveList = Object.values(map);

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
        targetChannel = savedSession.channel;
        const existsInList = liveList.some(
          (l) => l.channel === savedSession.channel
        );
        if (!existsInList && savedSession.astrologer) {
          liveList = [
            {
              channel: savedSession.channel,
              uid: savedSession.uid,
              astrologer: savedSession.astrologer,
            },
            ...liveList,
          ];
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
        astrologerName: `${l.astrologer?.firstName || ""} ${
          l.astrologer?.lastName || ""
        }`.trim(),
        astrologerId: l.astrologer?._id,
        rating: l.astrologer?.rating,
        expertise: l.astrologer?.expertise,
        imageUrl: l.astrologer?.profileImgUrl || l.astrologer?.imageUrl,
        audioCallRate: l.astrologer?.price?.audioRate?.amount,
        videoCallRate: l.astrologer?.price?.videoCallRate?.amount,
        uid: l.uid,
        startedAt: l.startedAt,
      }))}
      autoStartIndex={autoStartIndex}
    >
      <InteractiveLiveStreaming />
    </LiveListProvider>
  );
};

export default LivePlayerPage;
