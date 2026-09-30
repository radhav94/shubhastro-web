import { useNavigate } from "react-router-dom";
import { useCall } from "../../context/CallContext";
import { getUserFromStorage } from "../../utils/authStorage";
import { PATH } from "../../utils/routes/Paths";
import { FreeCallScreen, FreeCallLockBar } from "./FreeCallUI";

/*
 * Locked end state of the user's free first-session AUDIO call (Figma
 * 4886:78009 "User 1st call lock"): the same call screen — header at
 * "00:00 End", ring avatar, name, status and the final duration — without the
 * Mute / End Call / Speaker controls, and a bottom bar offering to continue at
 * the discounted audio rate.
 *
 * VoiceCall unmounts as soon as the call ends (activeCall is cleared), so this
 * is rendered by VideoCallContainer from the snapshot VoiceCall leaves in
 * CallContext (`endedFreeCall`). The post-call review modal (StickyReview)
 * still opens on top of it, as after any call.
 */
const FreeCallEndedScreen = () => {
  const { endedFreeCall, setEndedFreeCall } = useCall();
  const navigate = useNavigate();

  if (!endedFreeCall) return null;

  const {
    astrologerId,
    callerName,
    profileImage,
    thumbImage,
    gender,
    experience,
    offer,
    durationSeconds,
  } = endedFreeCall;

  const dismiss = () => setEndedFreeCall(null);

  // Same as the chat's locked footer: the session is over, so recharge on the
  // recharge page and come back to this astrologer's profile.
  const handleRecharge = () => {
    const returnUrl = astrologerId
      ? `/astrologer/${astrologerId}`
      : PATH.privateRoutes.Chat_With_ASTROLOGER.path;
    dismiss();
    navigate(`${PATH.privateRoutes.RECHARGE.path}?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleExplore = () => {
    dismiss();
    navigate("/");
  };

  return (
    <FreeCallScreen
      ariaLabel="Free call ended"
      callerName={callerName}
      experience={experience}
      thumbImage={thumbImage}
      profileImage={profileImage}
      gender={gender}
      isEnded
      status="Call ended"
      statusTone="ended"
      durationSeconds={durationSeconds}
      onBack={dismiss}
      bottom={
        <FreeCallLockBar
          userName={getUserFromStorage()?.firstName}
          profileImgUrl={thumbImage}
          gender={gender}
          offer={offer}
          onExplore={handleExplore}
          onRecharge={handleRecharge}
        />
      }
    />
  );
};

export default FreeCallEndedScreen;
