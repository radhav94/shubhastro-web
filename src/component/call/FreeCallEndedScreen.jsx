import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import styles from "./VoiceCall.module.scss";
import freeStyles from "./FreeCall.module.scss";
import { useCall } from "../../context/CallContext";
import { capitalizeWords } from "../../utils/capitalize";
import { getAstrologerDefaultImage } from "../../utils/appImages";
import { getUserFromStorage } from "../../utils/authStorage";
import { PATH } from "../../utils/routes/Paths";
import {
  FreeSessionHeader,
  FreeSessionLockBar,
} from "../../screens/private/home/components/chats/freeSession/FreeSessionUI";

/*
 * Locked end state of the user's free first-session AUDIO call (Figma "Web Free
 * chat user journey", 4787:30449, adapted to the call screen).
 *
 * VoiceCall unmounts as soon as the call ends (activeCall is cleared), so this
 * is rendered by VideoCallContainer from the snapshot VoiceCall leaves in
 * CallContext (`endedFreeCall`). It keeps the call screen's look — header,
 * avatar — with the free badge at "00:00 End", and in place of the call
 * controls offers to continue at the discounted audio rate. The post-call
 * review modal (StickyReview) still opens on top of it, as after any call.
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
    role,
    experience,
    offer,
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

  const onImgError = (e) => {
    e.currentTarget.src = getAstrologerDefaultImage(gender);
  };

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "Astrologer";

  return (
    <div className={styles.fullscreenWrapper} role="dialog" aria-label="Free call ended">
      <div className={styles.headerWrap}>
        <div className={`${styles.header} ${freeStyles.endedHeader}`}>
          <button className={styles.backBtn} onClick={dismiss} aria-label="Close">
            <IoArrowBack size={24} />
          </button>
          <img
            src={thumbImage || getAstrologerDefaultImage(gender)}
            alt={callerName}
            width={40}
            height={40}
            onError={onImgError}
            className={freeStyles.endedThumb}
          />
          <div className={styles.astrologerInfo}>
            <h3 className={styles.astrologerName}>{capitalizeWords(callerName)}</h3>
            <p className={styles.astrologerExp}>
              {roleLabel} • Exp. {experience || "0"} Years
            </p>
          </div>
        </div>
      </div>

      <div className={freeStyles.freeStrip}>
        <FreeSessionHeader title="1st Free Call" isEnded className={freeStyles.freeHeader} />
      </div>

      <div className={`${styles.voiceCenter} ${freeStyles.endedCenter}`}>
        <div className={styles.voiceCenterWrap}>
          <div className={styles.avatarContainer}>
            <img
              className={`${styles.avatar} ${freeStyles.endedAvatar}`}
              src={profileImage || getAstrologerDefaultImage(gender)}
              alt={callerName}
              onError={onImgError}
            />
          </div>
          <h1 className={styles.callerNameTitle}>{capitalizeWords(callerName)}</h1>
          <span className={styles.totalTime}>Your free call has ended</span>
        </div>
      </div>

      <div className={freeStyles.lockDock}>
        <FreeSessionLockBar
          sessionLabel="call"
          userName={getUserFromStorage()?.firstName}
          profileImgUrl={thumbImage}
          gender={gender}
          offer={offer}
          onExplore={handleExplore}
          onRecharge={handleRecharge}
        />
      </div>
    </div>
  );
};

export default FreeCallEndedScreen;
