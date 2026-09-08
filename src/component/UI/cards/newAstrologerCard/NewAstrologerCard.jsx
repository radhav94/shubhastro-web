import { memo, useId, useState } from "react";
import { BookOpen } from "lucide-react";
import styles from "./NewAstrologerCard.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { AppIcons, getAstrologerDefaultImage, getAstrologerImageUrl } from "../../../../utils/appImages";
import useAstrologerLiveStatus from "../../../../hooks/useAstrologerLiveStatus";
import { resolveLiveChannelForAstrologer } from "../../../../utils/helper/resolveLiveChannel";
import toast from "../../../toast";
import { unavailableReason } from "../../../../utils/helper/astrologerAvailability";
import { getAstrologerDisplayName, getAstrologerProfilePath } from "../../../../utils/helper/string.utils";
// Served from public/ at the site root — referenced by URL, not imported.
const newStart = "/images/new-start.png";

const NewAstrologerCard = memo(({ 
  astrologer, 
  onConnect, 
  onEmergencyClick,
  className = "", 
  style = {},
  // Set on the first card(s) in a rail: loads the photo eagerly at high
  // priority because it is above the fold and a likely LCP element.
  priority = false,
}) => {
  const navigate = useNavigate();
  // The rating star SVG was exported from Figma with a hardcoded
  // `id="clip0_4961_937"`. This card is rendered in lists, so a listing page
  // emitted that same id once per card — duplicate element ids are invalid HTML,
  // and `url(#id)` resolves to the first match in document order, so every
  // card's clip pointed at the first card's clipPath. It only looked right
  // because the clipPaths happen to be identical.
  const starClipId = `astroCardStarClip-${useId()}`;
  const isOnline = astrologer?.isActive === true;
  const { isLive, roomId: liveRoomId } = useAstrologerLiveStatus(astrologer?._id, astrologer?.astrologerLiveStatus);
  const activeTypes = astrologer?.isActiveType || [];
  const chatPrice = Number(astrologer?.price?.chatRate?.amount) || 0;
  const callPrice = Number(astrologer?.price?.audioRate?.amount) || 0;
  // When the astrologer is live streaming, chat and call are not available.
  const chatTypeActive = activeTypes.includes("all") || activeTypes.includes("chat");
  const callTypeActive = activeTypes.includes("all") || activeTypes.includes("audio");
  const chatEnabled = isOnline && !isLive && chatTypeActive && chatPrice > 0;
  const callEnabled = isOnline && !isLive && callTypeActive && callPrice > 0;

  const chatReason = unavailableReason({
    label: "Chat",
    isOnline,
    isLive,
    isTypeActive: chatTypeActive,
    hasPrice: chatPrice > 0,
  });
  const callReason = unavailableReason({
    label: "Call",
    isOnline,
    isLive,
    isTypeActive: callTypeActive,
    hasPrice: callPrice > 0,
  });

  const hasEmergency = astrologer?.isEmergencyAvailable && (
    astrologer?.emergencyPrice?.chatRate?.amount > 0 || 
    astrologer?.emergencyPrice?.audioRate?.amount > 0
  );

  const emergencyChatRate = Number(astrologer?.emergencyPrice?.chatRate?.amount) || 0;
  const emergencyCallRate = Number(astrologer?.emergencyPrice?.audioRate?.amount) || 0;
  const emergencyMinRate = emergencyChatRate > 0 && emergencyCallRate > 0
    ? Math.min(emergencyChatRate, emergencyCallRate)
    : emergencyChatRate || emergencyCallRate;

  /*
    `isLive` can be true while roomId is null, and interpolating it sent the user
    to "/live/undefined" — a deliberate "Join Live" tap landing on a room that
    cannot resolve. An earlier pass replaced that with a toast, treating the gap
    as transient. It isn't: roomId only reaches useAstrologerLiveStatus from the
    astrologer payload or the `live:astrologer_status` socket event, and that event
    fires on a status *change*, so anyone who loads this list while a stream is
    already running never receives it.

    Look the channel up from the live list instead, and only report failure when
    the astrologer genuinely isn't streaming. `joiningLive` gives the tap a visible
    response — a toast is invisible to Clarity, so a toast-only path keeps showing
    up as a dead click even when the copy is correct.
  */
  const [joiningLive, setJoiningLive] = useState(false);

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
      className={`${styles.astrologerCard} ${!isOnline ? styles.offlineCard : ''} ${className}`.trim()} 
      style={style}
    >
      {/* Live / Online / Offline badge */}
      {isLive ? (
        <button
          type="button"
          className={`${styles.statusBadge} ${styles.live}`}
          onClick={handleJoinLive}
          aria-label="Astrologer is live, click to watch"
        >
          <span className={styles.liveDot} />
          {joiningLive ? "Opening…" : "Live"}
        </button>
      ) : (
        <div className={`${styles.statusBadge} ${isOnline ? styles.online : styles.offline}`}>
          <span className={styles.statusDot} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      )}

      <div className={styles.ratingBadge}>
            <img src={newStart} width="11" height="11" alt="star" />
            {astrologer.rating ? Number(astrologer.rating).toFixed(1) : '0.0'}
          </div>

      <Link to={getAstrologerProfilePath(astrologer)} className={styles.cardLink}>
        <div className={styles.astrologerImageWrapper}>
          {/* These photos are the single biggest payload on the homepage — the
              CDN serves the originals (896x902, 1433x1433 …) for a box that
              renders around 100x115, and there is no resized variant to ask
              for. Until the upload pipeline emits thumbnails, at least keep the
              off-screen ones out of the initial load and the decode off the
              main thread. `.astrologerImg` is width/height 100% inside a sized
              parent, so no width/height attributes are needed — the box already
              reserves the space.

              `priority` opts the first card out of that. Blanket loading="lazy"
              also deferred the first card in the rail, which is above the fold
              and is the leading image LCP candidate on /astrologers and
              /chat-to-astrologer — Lighthouse fails this directly ("LCP
              resources should not use loading=lazy"), because the request cannot
              even start until layout has run. Callers should set it only on the
              first card or two. */}
          {/* "medium" (250x312), the helper's default.

              This was "small" (100x125) on the reasoning that
              .astrologerImageWrapper is only 100x100 (90x90 under 767px). That
              compared CSS pixels and ignored device pixel ratio: the traffic
              here is overwhelmingly mobile at 2x-3x DPR, where a 100x125 source
              is upscaled into a 200x200 or 300x300 device-pixel box and the
              avatar visibly softens. `medium` covers 2x with room to spare.

              The homepage rails ship `profileImages` on each astrologer
              (top-rated, our-astrologers and emergency all arrive as
              astrologer-grid sections), so the sized derivative is available
              here; the helper still falls back to profileImgUrl and then the
              gender default when a record predates it. */}
          <img
            src={getAstrologerImageUrl(astrologer, "medium")}
            alt={astrologer.firstName}
            className={styles.astrologerImg}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            onError={(e) => {
              e.target.src = getAstrologerDefaultImage(astrologer.gender);
            }}
          />
        </div>
        <h3 className={styles.astrologerName}>
          {getAstrologerDisplayName(astrologer)}
        </h3>
        {astrologer.experience && (
          <div className={styles.experienceRow}>
            <BookOpen size={18} className={styles.bookIcon} />
              {astrologer.experience} years exp.
          </div>
        )}
        {astrologer?.languagePreferences?.length > 0 && (
          <div className={styles.languages}>
            {astrologer.languagePreferences.map((lang, index) => (
              <span key={index} className={styles.languageBadge}>
                {lang.languageName}
              </span>
            ))}
          </div>
        )}
      </Link>
      <div className={styles.actionButtons}>
        {isLive ? (
          <div className={styles.buttonWrapper} style={{ width: '100%' }}>
            <button
              className={styles.liveBtn}
              onClick={handleJoinLive}
              aria-busy={joiningLive}
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
            <p className={styles.priceText}>&nbsp;</p>
          </div>
        ) : !isOnline && hasEmergency ? (
          <div className={styles.emergencyButtonWrapper}>
            <button
              className={styles.emergencySingleBtn}
              onClick={() => onEmergencyClick?.(astrologer)}
            >
              Emergency
            </button>
            {emergencyMinRate > 0 && (
              <p className={styles.priceText}>
                <span className={styles.priceAmount}>₹{emergencyMinRate}</span>/min
              </p>
            )}
          </div>
        ) : (
          <>
            {(chatEnabled || !callEnabled) && (
            <div className={styles.buttonWrapper}>
              <button
                className={`${styles.chatBtn} ${!chatEnabled ? styles.unavailable : ""}`.trim()}
                onClick={() => {
                  if (!chatEnabled) {
                    toast.info(chatReason);
                    return;
                  }
                  onConnect(astrologer, "chat");
                }}
                aria-disabled={!chatEnabled}
                title={!chatEnabled ? chatReason : "Start chat"}
              >
                <img src={AppIcons.ChatMinutesIcon} alt="" /> Chat
              </button>
              <p className={styles.priceText}>
                {chatPrice > 0 ? (
                  astrologer?.price?.chatRate?.isDiscountActive && astrologer?.price?.chatRate?.beforeDiscountPrice ? (
                    <>
                      <span className={styles.originalPrice}>₹{astrologer?.price?.chatRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{chatPrice}</span> min
                    </>
                  ) : (
                    <>
                      <span className={styles.priceAmount}>₹{chatPrice}</span> min
                    </>
                  )
                ) : <>&nbsp;</>}
              </p>
            </div>
            )}
            {(callEnabled || !chatEnabled) && (
            <div className={styles.buttonWrapper}>
              <button
                className={`${styles.callBtn} ${!callEnabled ? styles.unavailable : ""}`.trim()}
                onClick={() => {
                  if (!callEnabled) {
                    toast.info(callReason);
                    return;
                  }
                  onConnect(astrologer, "audio");
                }}
                aria-disabled={!callEnabled}
                title={!callEnabled ? callReason : "Start call"}
              >
                <img src={AppIcons.CallMinutesIcon} alt="" /> Call
              </button>
              <p className={styles.priceText}>
                {callPrice > 0 ? (
                  astrologer?.price?.audioRate?.isDiscountActive && astrologer?.price?.audioRate?.beforeDiscountPrice ? (
                    <>
                      <span className={styles.originalPrice}>₹{astrologer?.price?.audioRate?.beforeDiscountPrice}</span>/<span className={styles.priceAmount}>{callPrice}</span> min
                    </>
                  ) : (
                    <>
                      <span className={styles.priceAmount}>₹{callPrice}</span> min
                    </>
                  )
                ) : <>&nbsp;</>}
              </p>
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

NewAstrologerCard.displayName = "NewAstrologerCard";

export default NewAstrologerCard;
