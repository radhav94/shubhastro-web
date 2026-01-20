import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAstrologerLiveList } from "../../../../../services/appServices/authService";

const LiveListingPage = () => {
  const navigate = useNavigate();
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

  if (!lives.length) return <div>No astrologer is live</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>🔴 Live Astrologers</h2>

      {lives.map((live) => (
        <div
          key={live.channel}
          style={{ padding: 12, border: "1px solid #ddd", marginTop: 10 }}
          onClick={() => navigate(`/live/${live.channel}`)}
        >
          Astrologer is LIVE
          <div style={{ fontSize: 12 }}>{live.channel}</div>
        </div>
      ))}
    </div>
  );
};

export default LiveListingPage;
