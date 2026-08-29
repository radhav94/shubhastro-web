import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link, useNavigate } from "react-router-dom";
import {
  AppIcons,
  appSvgs,
  getAstrologerDefaultImage,
  getAstrologerImageUrl,
} from "../../../../utils/appImages";
import EmergencySessionModal from "../../modal/EmergencySessionModal/EmergencySessionModal";
import useAstrologerLiveStatus from "../../../../hooks/useAstrologerLiveStatus";
import { resolveLiveChannelForAstrologer } from "../../../../utils/helper/resolveLiveChannel";
import { getAstrologerAvailability } from "../../../../utils/helper/astrologerAvailability";
import toast from "../../../toast";
import { getAstrologerDisplayName, getAstrologerProfilePath } from "../../../../utils/helper/string.utils";

const NewAstrologerDetailsCard = ({
  astrologer,
  onConnect,
  className = "",
  style = {},
  // Set on the first card only: loads the photo eagerly at high priority
  // because it is the one card in this list that can be above the fold.
  priority = false,
  // "chat" | "audio" | null — which of this card's connect requests is still
  // resolving. Supplied by the parent from useAstrologerConnect's isConnecting.
  connectingType = null,
}) => {
  const navigate = useNavigate();
  const isOnline = astrologer?.isActive === true;
  const { isLive, roomId: liveRoomId } = useAstrologerLiveStatus(astrologer?._id, astrologer?.astrologerLiveStatus);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  // When the astrologer is live streaming, chat and call are not available.
  const { chatPrice, callPrice, chatEnabled, callEnabled, chatReason, callReason } =
    getAstrologerAvailability(astrologer, isLive);
  const hasEmergency = astrologer?.isEmergencyAvailable && (
    astrologer?.emergencyPrice?.chatRate?.amount > 0 ||
    astrologer?.emergencyPrice?.audioRate?.amount > 0
  );
  const emergencyChatRate = Number(astrologer?.emergencyPrice?.chatRate?.amount) || 0;
  const emergencyCallRate = Number(astrologer?.emergencyPrice?.audioRate?.amount) || 0;
  const emergencyMinRate = emergencyChatRate > 0 && emergencyCallRate > 0
    ? Math.min(emergencyChatRate, emergencyCallRate)
    : emergencyChatRate || emergencyCallRate;
  const imageUrl = getAstrologerImageUrl(astrologer);

  /*
    `isLive` and `roomId` come from the same hook but do not arrive together.
    Interpolating a null roomId sent the user to "/live/undefined", which cannot
    resolve a room. A previous pass swapped that for a toast on the assumption the
    gap was transient — it isn't. roomId reaches useAstrologerLiveStatus only from
    the astrologer payload or the `live:astrologer_status` socket event, and that
    event fires on a status *change*, so a visitor who loads this card while the
    stream is already running never receives it and every join control stays a
    no-op for the whole visit.

    Resolve the channel from the live list instead, and only report failure when
    the astrologer genuinely isn't streaming. `joiningLive` makes the tap visibly
    do something, which a toast does not — Clarity cannot see toasts, so a
    toast-only path keeps being logged as a dead click.
  */
  const [joiningLive, setJoiningLive] = useState(false);

  /*
    Why the unavailable reason is rendered on the card instead of toasted.

    Chat and Call stay tappable when the astrologer can't take the session (the
    house pattern — a `disabled` button fires no event at all), and the tap was
    answered with `toast.info(reason)`. That answer is invisible where it matters:
    the toast is portalled to the edge of the viewport, it mutates nothing in the
    card that was tapped, and react-hot-toast renders an identical repeat as no
    visible change at all. So the tap is logged as dead, and a visitor tapping
    again gets less feedback each time, not more.

    A Clarity session: three Call taps on the listing at 01:13, 01:14 and 01:16,
    and the "Astrologer is offline" line only registering with the visitor at
    01:18 — after the third attempt.

    Now the reason lands under the buttons it belongs to. `seq` keys the element so
    a repeat tap remounts it and replays the animation rather than setting the same
    string twice.
  */
  const [blockedNote, setBlockedNote] = useState(null);

  const reportBlocked = (reason) =>
    setBlockedNote((prev) => ({ text: reason, seq: (prev?.seq || 0) + 1 }));

  // Clear it again so a card left on screen doesn't keep stale advice.
  useEffect(() => {
    if (!blockedNote) return undefined;
    const id = setTimeout(() => setBlockedNote(null), 5000);
    return () => clearTimeout(id);
  }, [blockedNote]);

  const handleJoinLive = async () => {
    if (joiningLive) return;

    if (liveRoomId) {
      navigate(`/live/${liveRoomId}`);
      return;
    }

    setJoiningLive(true);
    try {
      const channel = await resolveLiveChannelForAstrologer(astrologer?._id);
      if (channel) {
        navigate(`/live/${channel}`);
        return;
      }
      toast.error("This live session just ended. Try another astrologer.");
    } finally {
      setJoiningLive(false);
    }
  };

  return (
    <div
      className={`${styles.detailsCard} ${!isOnline ? styles.offlineDetailsCard : ""} ${className}`.trim()}
      style={style}
    >
      {isLive ? (
        <button
          type="button"
          className={`${styles.statusBadge} ${styles.live}`}
          onClick={handleJoinLive}
          aria-label="Astrologer is live, click to watch"
        >
          <span className={styles.liveDot} />
          <span>{joiningLive ? "Opening…" : "Live"}</span>
        </button>
      ) : (
        <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
      )}

      {/*
        Full-card tap target. Kept as an empty overlay anchor so the action
        buttons stay on top, but it needs an accessible name — without one it is
        an anonymous link to assistive tech and to tap heuristics.
      */}
      <Link
        to={getAstrologerProfilePath(astrologer)}
        className={styles.detailsImageLink}
        aria-label={`View ${getAstrologerDisplayName(astrologer)}'s profile`}
      ></Link>
        <div className={styles.detailsImageWrapper}>
          {/* This card had no `loading` attribute, so every photo in the list
              was eager. The list is infinite-scrolled 9 at a time and the CDN
              serves unresized originals (896x902, 1433x1433 …) into a box that
              renders around 95x156, so a first page of results kicked off nine
              full-size downloads at once — all but the first below the fold —
              competing with the entry bundle and the API call that first paint
              is waiting on. `.detailsImage` is 100%/100% inside a sized parent,
              so the box already reserves the space and no width/height
              attributes are needed. */}
          <img
            src={imageUrl}
            alt={`${astrologer?.firstName} ${astrologer?.lastName}`}
            className={styles.detailsImage}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            onError={(e) => { e.target.src = getAstrologerDefaultImage(astrologer?.gender); }}
          />
        </div>

      <div className={styles.detailsInfo}>
        <Link to={getAstrologerProfilePath(astrologer)} className={styles.detailsNameLink}>
          <h3 className={styles.detailsName}>
            {getAstrologerDisplayName(astrologer)}
          </h3>
        </Link>

        <div className={styles.detailsMeta}>
          <div className={styles.detailsExperience}>
            <img src={appSvgs.Experience} className={styles.detailsExperienceIcon} alt="" />
            <span className={styles.detailsExperienceText}>
              {parseInt(astrologer?.experience) || 0} yrs
            </span>
          </div>
          {astrologer?.rating > 0 && (
            <div className={styles.detailsRatingInline}>
              <Star size={12} fill="#FFB246" stroke="#FFB246" />
              <span>{astrologer.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <p className={styles.detailsSpecialties}>
          {astrologer?.expertise?.slice(0, 2)?.map((e) => (typeof e === "object" ? e.title : e)).join(" · ")}
          {astrologer?.expertise?.length > 2 ? " ..." : ""}
        </p>

        {astrologer?.languagePreferences?.length > 0 && (
          <div className={styles.detailsLanguages}>
            {astrologer.languagePreferences.map((lang, index) => (
              <span key={index} className={styles.detailsLanguageBadge}>
                {lang.languageName}
              </span>
            ))}
          </div>
        )}

        <div className={styles.detailsActionButtons}>
          {isLive ? (
            <div className={styles.detailsButtonWrapper} style={{ width: '100%' }}>
              <button
                className={styles.liveBtn}
                onClick={handleJoinLive}
              >
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="4" fill="#f75801"/>
                  <path d="M10.5 21.5C8.5 19.5 7.5 17 7.5 14.5C7.5 12 8.5 9.5 10.5 7.5" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M21.5 7.5C23.5 9.5 24.5 12 24.5 14.5C24.5 17 23.5 19.5 21.5 21.5" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M13 19C11.5 17.5 11 16 11 14.5C11 13 11.5 11.5 13 10" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M19 10C20.5 11.5 21 13 21 14.5C21 16 20.5 17.5 19 19" stroke="#f75801" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                {joiningLive ? "Opening…" : "Join Live"}
              </button>
              <p className={styles.detailsPriceText}>&nbsp;</p>
            </div>
          ) : !isOnline && hasEmergency ? (
            <div className={styles.emergencyButtonWrapper}>
              <button className={styles.emergencySingleBtn} onClick={() => setShowEmergencyModal(true)}>
                Emergency
              </button>
              {emergencyMinRate > 0 && (
                <p className={styles.detailsPriceText}>
                  <span className={styles.detailsPriceAmount}>₹{emergencyMinRate}</span>/min
                </p>
              )}
            </div>
          ) : (
            <>
              {(chatEnabled || !callEnabled) && (
              <div className={styles.detailsButtonWrapper}>
                <button
                  className={`${styles.detailsChatBtn} ${!chatEnabled ? styles.unavailable : ""}`.trim()}
                  onClick={() => {
                    if (!chatEnabled) {
                      reportBlocked(chatReason);
                      return;
                    }
                    onConnect(astrologer, "chat");
                  }}
                  aria-disabled={!chatEnabled}
                  aria-busy={connectingType === "chat"}
                  title={!chatEnabled ? chatReason : "Start chat"}
                >
                  {/* The balance/availability check behind onConnect is a network
                      round trip. Without a label change the button looks inert for
                      its duration, which is what produces repeated chat attempts
                      in session recordings. */}
                  <img src={AppIcons.ChatMinutesIcon} alt="" />{" "}
                  {connectingType === "chat" ? "Connecting…" : "Chat"}
                </button>
                <p className={styles.detailsPriceText}>
                  {chatPrice > 0 ? (
                    astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
                      <>
                        <span className={styles.detailsOriginalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.detailsPriceAmount}>{chatPrice}</span> min
                      </>
                    ) : (
                      <>
                        <span className={styles.detailsPriceAmount}>₹{chatPrice}</span> min
                      </>
                    )
                  ) : <>&nbsp;</>}
                </p>
              </div>
              )}
              {(callEnabled || !chatEnabled) && (
              <div className={styles.detailsButtonWrapper}>
                <button
                  className={`${styles.detailsCallBtn} ${!callEnabled ? styles.unavailable : ""}`.trim()}
                  onClick={() => {
                    if (!callEnabled) {
                      reportBlocked(callReason);
                      return;
                    }
                    onConnect(astrologer, "audio");
                  }}
                  aria-disabled={!callEnabled}
                  aria-busy={connectingType === "audio"}
                  title={!callEnabled ? callReason : "Start call"}
                >
                  <img src={AppIcons.CallMinutesIcon} alt="" />{" "}
                  {connectingType === "audio" ? "Connecting…" : "Call"}
                </button>
                <p className={styles.detailsPriceText}>
                  {callPrice > 0 ? (
                    astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
                      <>
                        <span className={styles.detailsOriginalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.detailsPriceAmount}>{callPrice}</span> min
                      </>
                    ) : (
                      <>
                        <span className={styles.detailsPriceAmount}>₹{callPrice}</span> min
                      </>
                    )
                  ) : <>&nbsp;</>}
                </p>
              </div>
              )}
            </>
          )}
        </div>

        {/* role="status" so it is announced as well as seen. See reportBlocked. */}
        {blockedNote && (
          <p key={blockedNote.seq} className={styles.detailsBlockedNote} role="status">
            {blockedNote.text}
          </p>
        )}
      </div>

      <EmergencySessionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        astrologer={astrologer}
        onChatNow={(astro) => onConnect(astro, "chat", true)}
        onCallNow={(astro) => onConnect(astro, "audio", true)}
        onVideoNow={(astro) => onConnect(astro, "video", true)}
      />
    </div>
  );
};

export default NewAstrologerDetailsCard;
