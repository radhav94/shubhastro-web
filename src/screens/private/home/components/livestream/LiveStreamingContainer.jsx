
// // src/components/LiveStreaming/LiveStreamingContainer.jsx
// import React from "react";
// import { useLocation } from "react-router-dom";
// import { useLiveStreaming } from "./useLiveStreaming";
// import { useLiveChat } from "./useLiveChat";
// import LiveView from "./LiveView";
// import StartLivePopup from "./StartLivePopup";
// import "./styles/live.scss";

// const LiveStreamingContainer = ({ client }) => {
//   const location = useLocation();

//   const ROLE = location.pathname.includes("/astrologer-dashboard/live-streaming")
//     ? "host"
//     : "audience";

//   const live = useLiveStreaming(client, ROLE);
//   const chat = useLiveChat(ROLE); // 🔥 chat hook

//   const { calling, setCalling } = live;

//   if (ROLE === "host" && !calling) {
//     return (
//       <StartLivePopup
//         onStart={() => {
//           setCalling(true);
//         }}
//       />
//     );
//   }

//   return (
//     <div className="live-container">
//       <LiveView ROLE={ROLE} {...live} {...chat} />
//     </div>
//   );
// };

// export default LiveStreamingContainer;



// src/components/LiveStreaming/LiveStreamingContainer.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { useLiveStreaming } from "./useLiveStreaming";
import { useLiveChat } from "./useLiveChat";
import LiveView from "./LiveView";
import StartLivePopup from "./StartLivePopup";
import "./styles/live.scss";

const LiveStreamingContainer = ({ client }) => {
  const location = useLocation();
  const ROLE = location.pathname.includes("/astrologer-dashboard/live-streaming")
    ? "host"
    : "audience";

  // 🟢 Hooks always called FIRST ✔
  const live = useLiveStreaming(client, ROLE);
  const chat = useLiveChat(ROLE);

  const { calling, setCalling } = live;

  // 🟢 UI return is the condition, NOT hook call ✔
  if (ROLE === "host" && !calling) {
    return <StartLivePopup onStart={() => setCalling(true)} />;
  }

  return (
    <div className="live-container">
      <LiveView ROLE={ROLE} {...live} {...chat} />
    </div>
  );
};

export default LiveStreamingContainer;


