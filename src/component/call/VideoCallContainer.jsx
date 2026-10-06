// import { useCall } from "../context/CallContext";
import { lazy, Suspense } from "react";
import { useCall } from "../../context/CallContext";
const VideoCalling = lazy(() => import("./VideoCall"));
const AgoraVoiceCalling = lazy(() => import("./VoiceCall"));
const FreeCallEndedScreen = lazy(() => import("./FreeCallEndedScreen"));


export default function VideoCallContainer() {
  const { activeCall, endedFreeCall } = useCall();

  // A free first-session audio call just ended: keep its locked end state up
  // (continue at the discounted rate / explore) until the user leaves it.
  // Own Suspense boundary so loading it never blanks the page behind.
  if (!activeCall) {
    return endedFreeCall ? (
      <Suspense fallback={null}>
        <FreeCallEndedScreen />
      </Suspense>
    ) : null;
  }

  // ⭐ Type based rendering
  if (activeCall.callType === "video") {
    return <VideoCalling callData={activeCall} />;
  }

  if (activeCall.callType === "audio") {
    return <AgoraVoiceCalling callData={activeCall} />;
  }

  return null;
}
