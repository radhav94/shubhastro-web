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

      setLives(Object.values(map));
    });
  }, []);

  return (
    <LiveListProvider
      lives={lives.map((l) => ({ channel: l.channel }))}
      autoStartIndex={0}   // 👈 important
    >
      <InteractiveLiveStreaming />
    </LiveListProvider>
  );
};

export default LivePlayerPage;
