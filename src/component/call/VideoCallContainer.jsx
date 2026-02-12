// import { useCall } from "../context/CallContext";
import { lazy } from "react";
import { useCall } from "../../context/CallContext";
const VideoCalling = lazy(() => import("./VideoCall"));
const AgoraVoiceCalling = lazy(() => import("./VoiceCall"));


export default function VideoCallContainer() {
  const { activeCall } = useCall();

  if (!activeCall) return null;

  // ⭐ Type based rendering
  if (activeCall.callType === "video") {
    return <VideoCalling callData={activeCall} />;
  }

  if (activeCall.callType === "audio") {
    return <AgoraVoiceCalling callData={activeCall} />;
  }

  return null;
}
