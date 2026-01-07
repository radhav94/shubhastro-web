import React, { useEffect, useState } from "react";
import InteractiveLiveStreaming from "./InteractiveLiveStreaming";
import { LiveListProvider } from "../../../../../context/LiveListContext";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";

const LivePlayerPage = () => {
  const [lives, setLives] = useState([]);

  useEffect(() => {
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

      console.log("mappppp",map);

      setLives(Object.values(map));
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
  autoStartIndex={0}
>
  <InteractiveLiveStreaming />
</LiveListProvider>

  );
};

export default LivePlayerPage;
