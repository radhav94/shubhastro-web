import { memo } from "react";
import { useNavigate } from "react-router-dom";
import joinLiveSessionImg from "../../../../assets/images/join-live-session-img.png";

const LiveSessionCard = memo(({ styles, sectionData }) => {
  const navigate = useNavigate();

  const title = sectionData?.sub_title || "Talk to Astrologers Live";
  const description = sectionData?.description || "Join astrologers live and start a consultation whenever you need trusted advice.";
  const image = sectionData?.image_url?.original || joinLiveSessionImg;
  const displayTitle = sectionData?.display_title || sectionData?.title || "Live Sessions";

  return (
    <div className={styles.liveSessionCard} onClick={() => navigate("/live")}>
      <div className={styles.liveSessionContent}>
        <div className={styles.liveSessionBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M5.33333 4.9967C5.33333 5.73308 5.93029 6.33003 6.66667 6.33003C7.40305 6.33003 8 5.73308 8 4.9967C8 4.26032 7.40305 3.66337 6.66667 3.66337C5.93029 3.66337 5.33333 4.26032 5.33333 4.9967Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M9.33333 4.99666C9.33333 4.23402 9.07803 3.5329 8.64786 2.97149C8.42393 2.67923 8.47932 2.26077 8.77158 2.03683C9.06384 1.8129 9.4823 1.86829 9.70623 2.16055C10.3085 2.94654 10.6667 3.93072 10.6667 4.99666C10.6667 6.10762 10.2776 7.12952 9.62892 7.93094C9.39726 8.21712 8.97748 8.26133 8.69129 8.02968C8.40511 7.79803 8.3609 7.37824 8.59255 7.09206C9.05612 6.51935 9.33333 5.79128 9.33333 4.99666Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M4 4.99666C4 4.23302 4.25598 3.53106 4.68717 2.96928C4.91135 2.6772 4.85631 2.2587 4.56423 2.03452C4.27216 1.81034 3.85365 1.86538 3.62947 2.15746C3.0258 2.94395 2.66667 3.92931 2.66667 4.99666C2.66667 6.10676 3.05511 7.12794 3.70292 7.92908C3.93442 8.21539 4.35419 8.25981 4.64049 8.0283C4.92679 7.7968 4.97121 7.37703 4.73971 7.09073C4.27678 6.51823 4 5.79067 4 4.99666Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M12 4.99668C12 3.50865 11.4592 2.14864 10.5625 1.09991C10.3233 0.820061 10.3562 0.399235 10.636 0.159968C10.9159 -0.0792983 11.3367 -0.0463999 11.5759 0.233449C12.6713 1.51453 13.3333 3.17914 13.3333 4.99668C13.3333 6.85605 12.6405 8.55521 11.4998 9.84755C11.2562 10.1236 10.8349 10.1499 10.5588 9.90622C10.2828 9.66257 10.2565 9.24128 10.5002 8.96524C11.4341 7.90713 12 6.51881 12 4.99668Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M1.33333 4.99668C1.33333 3.50875 1.87409 2.14881 2.77063 1.10011C3.00989 0.820254 2.97697 0.39943 2.69711 0.160176C2.41725 -0.0790784 1.99643 -0.0461613 1.75717 0.233698C0.661993 1.51475 -7.94423e-08 3.17926 0 4.99668C8.11656e-08 6.85354 0.690996 8.55063 1.8289 9.84232C2.07228 10.1186 2.49355 10.1453 2.76983 9.90188C3.0461 9.6585 3.07277 9.23723 2.82939 8.96096C1.89774 7.90339 1.33333 6.51676 1.33333 4.99668Z" fill="#E05310"/>
        </svg>
          <span>{displayTitle}</span>
        </div>
        <h3 className={styles.liveSessionTitle}>
          {title.includes("Live") ? (
            <>{title.replace("Live", "")}<span className={styles.liveSessionHighlight}>Live</span></>
          ) : (
            title
          )}
        </h3>
        <p className={styles.liveSessionDesc}>{description}</p>
        <button className={styles.liveSessionBtn}>
          Join Live Session
        </button>
      </div>
      <div className={styles.liveSessionImgWrap}>
        <img
          src={image}
          alt="Live astrology session"
          className={styles.liveSessionImg}
          width={395}
          height={329}
          loading="lazy"
        />
      </div>
    </div>
  );
});

LiveSessionCard.displayName = "LiveSessionCard";

export default LiveSessionCard;
