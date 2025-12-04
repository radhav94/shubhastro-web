// import {
//   LocalUser,
//   RemoteUser,
//   useIsConnected,
//   useJoin,
//   useLocalMicrophoneTrack,
//   useLocalCameraTrack,
//   usePublish,
//   useRemoteUsers,
// } from "agora-rtc-react";
// import { useEffect, useState } from "react";
// import AgoraRTC, { AgoraRTCProvider } from "agora-rtc-react";
// import { useLocation } from "react-router-dom";

// // *** Agora Credentials ***
// const APP_ID = "b7bd8229702e4ec3b0938ea15f23a39c";
// const CHANNEL_NAME = "testnew";
// const TEMP_TOKEN =
//   "007eJxTYOhWE353dZK6dNfS82ab6nM0j2cVuj3qvL130YYzWaKsVycrMCSZJ6VYGBlZmhsYpZqkJhsnGVgaW6QmGpqmGRknGlsmf28zyGwIZGRQ57vFwsgAgSA+O0NJanFJXmo5AwMA2iIhKw==";
// // ****************************************

// export const InteractiveLiveStreaming = () => {
//   const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });

//   return (
//     <AgoraRTCProvider client={client}>
//       <Basics client={client} />
//     </AgoraRTCProvider>
//   );
// };

// const Basics = ({ client }) => {
//   const location = useLocation();

//   // Auto detect Role from Route
//   const ROLE = location.pathname.includes("/astrologer-dashboard/live-streaming")
//     ? "host"
//     : "audience";


//   const [calling, setCalling] = useState(true); // auto join
//   const isConnected = useIsConnected();
//   const [micOn, setMic] = useState(true);
//   const [cameraOn, setCamera] = useState(true);

//   // Set client role explicitly after client creation
//   useEffect(() => {
//     if (client) client.setClientRole(ROLE);
//   }, [client, ROLE]);

//   useJoin(
//     {
//       appid: APP_ID,
//       channel: CHANNEL_NAME,
//       token: TEMP_TOKEN,
//       role: ROLE,
//     },
//     calling
//   );

//   const { localMicrophoneTrack } = useLocalMicrophoneTrack(
//     micOn && ROLE === "host"
//   );
//   const { localCameraTrack } = useLocalCameraTrack(
//     cameraOn && ROLE === "host"
//   );

//   // Publish only once Host is fully connected and track exists
//   const shouldPublish =
//     isConnected && ROLE === "host" && localCameraTrack && localMicrophoneTrack;

//   usePublish(
//     shouldPublish ? [localMicrophoneTrack, localCameraTrack] : []
//   );

//   const remoteUsers = useRemoteUsers();

//   useEffect(() => {
//     console.log("📡 Remote Users: ", remoteUsers);
//   }, [remoteUsers]);

//   return (
//     <>
//       <h2 style={{ marginBottom: 10 }}>
//         🎥 Live Stream — {ROLE.toUpperCase()}
//       </h2>

//       {/* HOST SIDE - Self preview */}
//       {ROLE === "host" && isConnected && localCameraTrack && (
//         <div>
//           <LocalUser
//             audioTrack={localMicrophoneTrack}
//             cameraOn={cameraOn}
//             playAudio={false}
//             micOn={micOn}
//             videoTrack={localCameraTrack}
//             style={{
//               width: "90%",
//               height: 320,
//               border: "3px solid #00c853",
//               borderRadius: 10,
//             }}
//           >
//             <samp>Astrologer (You)</samp>
//           </LocalUser>
//         </div>
//       )}

//       {/* AUDIENCE SIDE - Watch Remote Video */}
//       {ROLE === "audience" &&
//         remoteUsers.length > 0 &&
//         remoteUsers.map((user) => (
//           <div key={user.uid}>
//             <RemoteUser
//               user={user}
//               style={{
//                 width: "90%",
//                 height: 320,
//                 border: "3px solid #2979ff",
//                 borderRadius: 10,
//               }}
//             >
//               <samp>Astrologer #{user.uid}</samp>
//             </RemoteUser>
//           </div>
//         ))}

//       {/* Waiting placeholder */}
//       {ROLE === "audience" && remoteUsers.length === 0 && (
//         <p>⏳ Astrologer has not started streaming yet…</p>
//       )}

//       {/* Host Controls */}
//       {isConnected && ROLE === "host" && (
//         <div style={{ marginTop: 20 }}>
//           <button onClick={() => setMic((m) => !m)}>
//             {micOn ? "Disable Mic" : "Enable Mic"}
//           </button>

//           <button onClick={() => setCamera((c) => !c)} style={{ marginLeft: 10 }}>
//             {cameraOn ? "Disable Camera" : "Enable Camera"}
//           </button>

//           <button
//             onClick={() => setCalling(false)}
//             style={{ marginLeft: 10 }}
//           >
//             End Stream
//           </button>
//         </div>
//       )}
//     </>
//   );
// };

// export default InteractiveLiveStreaming;
