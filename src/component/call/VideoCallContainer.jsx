// import { useCall } from "../context/CallContext";
import { useCall } from "../../context/CallContext";
import VideoCalling from "./VideoCall";
import AgoraVoiceCalling from "./VoiceCall";


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
