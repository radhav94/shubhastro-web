// import { useEffect, useState } from "react";
// import voiceSocketServices from "../../services/voiceSocketServices";

// export default function useVoiceCall({
//   userId,
//   astrologerId,
//   roomId,
//   isUserSide,
// }) {

//   const [isCalling, setIsCalling] = useState(false);
//   const [remoteJoined, setRemoteJoined] = useState(false);
//   const [callStatus, setCallStatus] = useState("idle"); // idle | calling | ringing | onCall | ended | busy | rejected
//   const [token, setToken] = useState(null);
//   const [channelName, setChannelName] = useState(null);
//   const [error, setError] = useState(null);

//   // SOCKET INITIALIZE & JOIN ROOM
//   useEffect(() => {
//     voiceSocketServices.connect({
//       onConnected: () => {
//         voiceSocketServices.joinRoom({ roomId, userId, astrologerId });
//       },
//       onError: (msg) => setError(msg),
//     });

//     voiceSocketServices.listenEvents({
//       onIncomingCall: (data) => {
//         setChannelName(data.channelName);
//         setToken(data.token);
//         setCallStatus("ringing");
//       },

//       onCallAccepted: (data) => {
//         setCallStatus("onCall");
//         setIsCalling(true); // Agora join flag
//       },

//       onCallRejected: () => {
//         setCallStatus("rejected");
//         setIsCalling(false);
//       },

//       onCallBusy: () => {
//         setCallStatus("busy");
//         setIsCalling(false);
//       },

//       onCallEnded: () => {
//         setCallStatus("ended");
//         setIsCalling(false);
//       },

//       onMissedCall: () => {
//         setCallStatus("ended");
//         setIsCalling(false);
//       },
//     });

//     return () => voiceSocketServices.removeListeners();
//   }, [roomId, userId, astrologerId]);

//   /******************
//    * ACTIONS USERS CAN DO
//    ******************/

//   // USER INITIATE CALL
//   const startCall = () => {
//     setCallStatus("calling");

//     voiceSocketServices.startCall(
//       {
//         roomId,
//         userId,
//         astrologerId,
//         channelName: "shubhtalk",
//         startTime: Date.now(),
//         uid: 12345678,
//       },
//       (res) => {
//         if (res?.error) {
//           setCallStatus("busy");
//         } else {
//           setChannelName(res.channelName);
//           setToken(res.token);
//           setIsCalling(true); // now Agora join
//         }
//       }
//     );
//   };

//   // ASTRO ACCEPT CALL
//   const acceptCall = () => {
//     voiceSocketServices.markCallReceived({ roomId });
//     setCallStatus("onCall");
//     setIsCalling(true);
//   };

//   // BOTH SIDE REJECT
//   const rejectCall = () => {
//     voiceSocketServices.rejectCall({ roomId });
//     setCallStatus("rejected");
//     setIsCalling(false);
//   };

//   // CALL END
//   const endCall = () => {
//     voiceSocketServices.endCall({ roomId });
//     setCallStatus("ended");
//     setIsCalling(false);
//   };

//   return {
//     isCalling,
//     remoteJoined,
//     callStatus,
//     token,
//     channelName,
//     error,

//     startCall,
//     acceptCall,
//     rejectCall,
//     endCall,

//     setRemoteJoined, // use to toggle when Agora remote user joined
//   };
// }
