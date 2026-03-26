import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InteractiveLiveStreaming from "./InteractiveLiveStreaming";
import { LiveListProvider } from "../../../../../context/LiveListContext";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";
import { restoreViewerSession } from "../../../../../utils/liveSessionStorage";

const LivePlayerPage = () => {
  const { channelId } = useParams();
  const [lives, setLives] = useState([]);
  const [autoStartIndex, setAutoStartIndex] = useState(0);

  useEffect(() => {
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
    });
  }, [channelId]);

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
        uid: l.uid,
      }))}
      autoStartIndex={autoStartIndex}
    >
      <InteractiveLiveStreaming />
    </LiveListProvider>
  );
};

export default LivePlayerPage;
