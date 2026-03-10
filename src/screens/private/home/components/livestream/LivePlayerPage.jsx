import { useEffect, useState } from "react";
import InteractiveLiveStreaming from "./InteractiveLiveStreaming";
import { LiveListProvider } from "../../../../../context/LiveListContext";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";
import { restoreViewerSession } from "../../../../../utils/liveSessionStorage";

const LivePlayerPage = () => {
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

      // If we have a saved session channel, ensure it's in the list
      // and auto-start on that channel (reconnect after refresh)
      if (savedSession?.channel) {
        const savedChannel = savedSession.channel;
        const existsInList = liveList.some((l) => l.channel === savedChannel);

        if (!existsInList && savedSession.astrologer) {
          // Stream might still be active but API hasn't returned it yet
          // Add it from saved session so we can attempt reconnect
          liveList = [
            {
              channel: savedChannel,
              uid: savedSession.uid,
              astrologer: savedSession.astrologer,
            },
            ...liveList,
          ];
        }

        // Find the index of the saved channel to auto-start there
        const idx = liveList.findIndex((l) => l.channel === savedChannel);
        if (idx >= 0) {
          setAutoStartIndex(idx);
        }
      }

      setLives(liveList);
    });
  }, []);

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
