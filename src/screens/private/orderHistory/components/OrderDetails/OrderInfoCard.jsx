import { useState, useRef, useEffect, useCallback } from "react";
import Hls from "hls.js";
import { Video, Phone, Calendar, Clock, X, MoreVertical } from "lucide-react";
import styles from "./OrderInfoCard.module.scss";
import RatingStars from "./RatingStars";
import ProgressBar from "./ProgressBar";

const OrderInfoCard = ({
  orderId,
  date,
  time,
  duration,
  amount,
  recordingUrl,
  type = "audio",
  astrologerName,
  astrologerImage,
  onConsultAgain,
  initialRating = null,
  roomId,
  onRateConsultation,
  isLive = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const mediaRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const videoHlsRef = useRef(null);

  // Attach HLS to a media element
  const attachHls = (media, url, refObj) => {
    if (!media || !url) return null;
    const isHlsUrl = url.includes(".m3u8");
    if (isHlsUrl && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.loadSource(url);
      hls.attachMedia(media);
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS Error:", data.type, data.details);
      });
      refObj.current = hls;
      return hls;
    } else if (isHlsUrl && media.canPlayType("application/vnd.apple.mpegurl")) {
      media.src = url;
    } else if (!isHlsUrl) {
      media.src = url;
    }
    return null;
  };

  // Audio (call tab) is attached lazily on first play (see handleCardClick) so
  // recordings don't all load on page mount. Just clean up on unmount.
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Setup HLS for video modal
  useEffect(() => {
    if (!showVideoModal || !recordingUrl) return;
    const video = videoRef.current;
    if (!video) return;
    const hls = attachHls(video, recordingUrl, videoHlsRef);
    video.play().catch(() => {});
    return () => { if (hls) hls.destroy(); videoHlsRef.current = null; };
  }, [showVideoModal, recordingUrl]);

  const handleCardClick = useCallback(() => {
    if (!recordingUrl) return;
    if (type === "video") {
      setShowVideoModal(true);
    } else {
      const media = mediaRef.current;
      if (!media) return;
      // Lazily attach HLS the first time the user plays, so audio loads only
      // when clicked instead of for every card on page load.
      if (!hlsRef.current && !media.src) {
        const hls = attachHls(media, recordingUrl, hlsRef);
        if (hls) {
          // HLS.js: start playback once the manifest has been parsed.
          hls.once(Hls.Events.MANIFEST_PARSED, () => media.play().catch(() => {}));
        } else {
          media.play().catch(() => {});
        }
        return;
      }
      if (isPlaying) { media.pause(); } else { media.play().catch(() => {}); }
    }
  }, [isPlaying, type, recordingUrl]);

  const closeVideoModal = useCallback(() => {
    const video = videoRef.current;
    if (video) video.pause();
    setShowVideoModal(false);
  }, []);

  // Audio progress tracking
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    const onTimeUpdate = () => {
      if (media.duration && isFinite(media.duration)) {
        setProgress((media.currentTime / media.duration) * 100);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); };
    media.addEventListener("timeupdate", onTimeUpdate);
    media.addEventListener("play", onPlay);
    media.addEventListener("pause", onPause);
    media.addEventListener("ended", onEnded);
    return () => {
      media.removeEventListener("timeupdate", onTimeUpdate);
      media.removeEventListener("play", onPlay);
      media.removeEventListener("pause", onPause);
      media.removeEventListener("ended", onEnded);
    };
  }, []);

  const formatDuration = (val) => {
    if (!val && val !== 0) return "0 Min 0 Secs";
    // Backend sends duration in minutes (e.g. 1 = 1 min, 2.5 = 2 min 30 sec)
    const totalSeconds = Math.round(val * 60);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins} Min ${secs} Secs`;
  };

  // ---- CALL CARD LAYOUT ----
  if (type === "audio") {
    return (
      <div className={styles.orderInfoCard}>
        <div className={styles.cardWrapper}>
          {orderId && (
            <div className={styles.cardHeader}>
              <h3 className={styles.orderId}>#{String(orderId).slice(-4)}</h3>
              {/* <button className={styles.menuButton} aria-label="More options">
                <MoreVertical size={20} />
              </button> */}
            </div>
          )}

          <div className={styles.cardContent} onClick={handleCardClick} role="button">
            <div className={styles.waveformIcon}>
              {isPlaying ? (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect width="3" height="20" x="4" y="10" fill="#111827" rx="1.5">
                    <animate attributeName="height" values="20;30;20" dur="1s" repeatCount="indefinite" />
                    <animate attributeName="y" values="10;5;10" dur="1s" repeatCount="indefinite" />
                  </rect>
                  <rect width="3" height="28" x="11" y="6" fill="#111827" rx="1.5">
                    <animate attributeName="height" values="28;18;28" dur="1s" repeatCount="indefinite" begin="0.2s" />
                    <animate attributeName="y" values="6;11;6" dur="1s" repeatCount="indefinite" begin="0.2s" />
                  </rect>
                  <rect width="3" height="24" x="18" y="8" fill="#111827" rx="1.5">
                    <animate attributeName="height" values="24;32;24" dur="1s" repeatCount="indefinite" begin="0.4s" />
                    <animate attributeName="y" values="8;4;8" dur="1s" repeatCount="indefinite" begin="0.4s" />
                  </rect>
                  <rect width="3" height="20" x="25" y="10" fill="#111827" rx="1.5">
                    <animate attributeName="height" values="20;28;20" dur="1s" repeatCount="indefinite" begin="0.15s" />
                    <animate attributeName="y" values="10;6;10" dur="1s" repeatCount="indefinite" begin="0.15s" />
                  </rect>
                  <rect width="3" height="26" x="32" y="7" fill="#111827" rx="1.5">
                    <animate attributeName="height" values="26;16;26" dur="1s" repeatCount="indefinite" begin="0.35s" />
                    <animate attributeName="y" values="7;12;7" dur="1s" repeatCount="indefinite" begin="0.35s" />
                  </rect>
                </svg>
              ) : (
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <circle cx="22" cy="22" r="20" fill="#fff" stroke="#F97316" strokeWidth="2" />
                  <polygon points="18,14 32,22 18,30" fill="#F97316" />
                </svg>
              )}
            </div>

            <div className={styles.infoSection}>
              <p className={styles.detailRow}>
                <span>{date}</span>
                <span className={styles.separator}>•</span>
                <span>{time}</span>
              </p>
              <p className={styles.detailRow}>
                <span>Duration : {typeof duration === "number" ? formatDuration(duration) : duration}</span>
              </p>
              <p className={styles.amount}>₹{amount}</p>
            </div>
          </div>

          <ProgressBar progress={progress} />
          <audio ref={mediaRef} preload="auto" style={{ display: "none" }} />

          <div className={styles.ratingSection}>
            <div className={styles.ratingRow}>
              {initialRating != null ? (
                <>
                  <span className={styles.ratingLabel}>Your Rating</span>
                  <RatingStars rating={initialRating} />
                </>
              ) : (
                <button className={styles.rateButton} onClick={(e) => { e.stopPropagation(); onRateConsultation?.(roomId); }}>
                  Rate Consultation
                </button>
              )}
            </div>
            <div
              className={`${styles.consultAgain} ${isLive ? styles.consultAgainDisabled : ""}`.trim()}
              onClick={isLive ? undefined : onConsultAgain}
              aria-disabled={isLive}
            >
              Consult Again
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- VIDEO CARD LAYOUT ----
  return (
    <div className={styles.orderInfoCard}>
      <div className={styles.cardWrapper}>
        <div className={styles.cardContent} onClick={handleCardClick} role="button">
          <img
            src={astrologerImage || "https://via.placeholder.com/100"}
            alt={astrologerName || "Astrologer"}
            className={styles.astrologerImage}
          />
          <div className={styles.infoSection}>
            <h3 className={styles.astrologerName}>{astrologerName || "Astrologer"}</h3>
            <p className={styles.detailRow}>
              <Calendar size={14} color="#F97316" />
              <span>{date}</span>
              <Clock size={14} color="#F97316" />
              <span>{time}</span>
            </p>
            <p className={styles.detailRow}>
              <span>Duration : {typeof duration === "number" ? formatDuration(duration) : duration}</span>
            </p>
            <p className={styles.amount}>₹{amount}</p>
          </div>
          <div className={styles.typeIcon}>
            <Video size={22} color="#F97316" />
          </div>
        </div>

        <div className={styles.ratingSection}>
          <div className={styles.ratingRow}>
            {initialRating != null ? (
              <>
                <span className={styles.ratingLabel}>Your Rating</span>
                <RatingStars rating={initialRating} />
              </>
            ) : (
              <button className={styles.rateButton} onClick={(e) => { e.stopPropagation(); onRateConsultation?.(roomId); }}>
                Rate Consultation
              </button>
            )}
          </div>
          <div className={styles.consultAgain} onClick={onConsultAgain}>Consult Again</div>
        </div>
      </div>

      {/* Video Player Modal */}
      {showVideoModal && (
        <div className={styles.videoOverlay} onClick={closeVideoModal}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeVideoModal} aria-label="Close">
              <X size={24} color="#fff" />
            </button>
            <video ref={videoRef} className={styles.videoPlayer} controls autoPlay playsInline />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderInfoCard;
