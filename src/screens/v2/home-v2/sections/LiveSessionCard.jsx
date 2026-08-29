import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAstrologerLiveList } from "../../../../services/appServices/authService";
import joinLiveSessionImg from "../../../../assets/images/join-live-session-img.png";

/*
 * How many astrologers are live, for the homepage card.
 *
 * The card used to advertise "Join Live Session" unconditionally, whether or not
 * a single astrologer was streaming. That turns the homepage into a coin flip:
 * the only way to find out was to click through to /live and read the answer
 * there, then come back. A Clarity session is exactly that loop — 48 minutes, 11
 * page loads and 8 clicks, mostly idling on the homepage, checking "Live" at
 * 22:33, taking "See who's online" out to the astrologer list, and returning to
 * the homepage at 24:22 to wait some more. LivePlayerPage's own comments describe
 * an earlier visitor doing the same thing across 17 page loads. They are polling
 * us by hand.
 *
 * The count comes from the same endpoint /live uses, and stays current through
 * the `live:astrologer_status` window event that useAstrologerStatusSocket
 * re-dispatches — the pattern AstrologerGridSection and useAstrologerLiveStatus
 * already follow. So when somebody goes live, the card the visitor is sitting in
 * front of says so, instead of them making the round trip to find out.
 *
 * Deliberately fail-open: if the request errors, `count` stays null and the card
 * renders exactly as it did before. A live card that hides itself on a flaky
 * network would be a worse trade than one that is occasionally optimistic.
 */
const useLiveCount = () => {
  const [count, setCount] = useState(null);

  const load = useCallback(() => {
    getAstrologerLiveList()
      .then((res) => {
        const data = res.data?.data || [];
        // Dedupe by channel the way LivePlayerPage does — the same stream can
        // appear more than once — and ignore entries with no astrologer, which
        // that page also drops as unrenderable.
        const channels = new Set(
          data.filter((item) => item?.astrologer && item?.channel).map((item) => item.channel)
        );
        setCount(channels.size);
      })
      .catch(() => {
        /* Leave `count` as it was: unknown renders the original copy. */
      });
  }, []);

  useEffect(() => {
    load();

    const onLiveStatus = () => load();
    window.addEventListener("live:astrologer_status", onLiveStatus);
    return () => window.removeEventListener("live:astrologer_status", onLiveStatus);
  }, [load]);

  return count;
};

const LiveSessionCard = memo(({ styles, sectionData }) => {
  const navigate = useNavigate();
  const liveCount = useLiveCount();

  const title = sectionData?.sub_title || "Talk to Astrologers Live";
  const description = sectionData?.description || "Join astrologers live and start a consultation whenever you need trusted advice.";
  const image = sectionData?.image_url?.original || joinLiveSessionImg;
  const displayTitle = sectionData?.display_title || sectionData?.title || "Live Sessions";

  // `null` = not known yet (or the request failed) — behave as before.
  const nobodyLive = liveCount === 0;

  const goLive = () => navigate("/live");
  const goAstrologers = () => navigate("/astrologers");

  // With nobody streaming, /live is a "Nobody is live right now" card. Send the
  // tap where it can actually be spent instead, and keep /live as the secondary
  // route for someone who wants to wait there.
  const primaryAction = nobodyLive ? goAstrologers : goLive;

  return (
    // Was a bare <div onClick>: no role, no tabIndex, no key handler, so the
    // card was unreachable by keyboard and announced as plain text. The visible
    // "Join Live Session" button below carried no handler of its own and only
    // worked by bubbling into this div — which meant the one element that looks
    // like the CTA had nothing attached to it.
    <div
      className={styles.liveSessionCard}
      role="button"
      tabIndex={0}
      aria-label={`${displayTitle}: ${title}`}
      style={{ cursor: "pointer" }}
      onClick={primaryAction}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          primaryAction();
        }
      }}
    >
      <div className={styles.liveSessionContent}>
        <div className={styles.liveSessionBadge}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="11" viewBox="0 0 14 11" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M5.33333 4.9967C5.33333 5.73308 5.93029 6.33003 6.66667 6.33003C7.40305 6.33003 8 5.73308 8 4.9967C8 4.26032 7.40305 3.66337 6.66667 3.66337C5.93029 3.66337 5.33333 4.26032 5.33333 4.9967Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M9.33333 4.99666C9.33333 4.23402 9.07803 3.5329 8.64786 2.97149C8.42393 2.67923 8.47932 2.26077 8.77158 2.03683C9.06384 1.8129 9.4823 1.86829 9.70623 2.16055C10.3085 2.94654 10.6667 3.93072 10.6667 4.99666C10.6667 6.10762 10.2776 7.12952 9.62892 7.93094C9.39726 8.21712 8.97748 8.26133 8.69129 8.02968C8.40511 7.79803 8.3609 7.37824 8.59255 7.09206C9.05612 6.51935 9.33333 5.79128 9.33333 4.99666Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M4 4.99666C4 4.23302 4.25598 3.53106 4.68717 2.96928C4.91135 2.6772 4.85631 2.2587 4.56423 2.03452C4.27216 1.81034 3.85365 1.86538 3.62947 2.15746C3.0258 2.94395 2.66667 3.92931 2.66667 4.99666C2.66667 6.10676 3.05511 7.12794 3.70292 7.92908C3.93442 8.21539 4.35419 8.25981 4.64049 8.0283C4.92679 7.7968 4.97121 7.37703 4.73971 7.09073C4.27678 6.51823 4 5.79067 4 4.99666Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M12 4.99668C12 3.50865 11.4592 2.14864 10.5625 1.09991C10.3233 0.820061 10.3562 0.399235 10.636 0.159968C10.9159 -0.0792983 11.3367 -0.0463999 11.5759 0.233449C12.6713 1.51453 13.3333 3.17914 13.3333 4.99668C13.3333 6.85605 12.6405 8.55521 11.4998 9.84755C11.2562 10.1236 10.8349 10.1499 10.5588 9.90622C10.2828 9.66257 10.2565 9.24128 10.5002 8.96524C11.4341 7.90713 12 6.51881 12 4.99668Z" fill="#E05310"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M1.33333 4.99668C1.33333 3.50875 1.87409 2.14881 2.77063 1.10011C3.00989 0.820254 2.97697 0.39943 2.69711 0.160176C2.41725 -0.0790784 1.99643 -0.0461613 1.75717 0.233698C0.661993 1.51475 -7.94423e-08 3.17926 0 4.99668C8.11656e-08 6.85354 0.690996 8.55063 1.8289 9.84232C2.07228 10.1186 2.49355 10.1453 2.76983 9.90188C3.0461 9.6585 3.07277 9.23723 2.82939 8.96096C1.89774 7.90339 1.33333 6.51676 1.33333 4.99668Z" fill="#E05310"/>
        </svg>
          <span>
            {liveCount > 0
              ? `${liveCount} live now`
              : displayTitle}
          </span>
        </div>
        <h3 className={styles.liveSessionTitle}>
          {title.includes("Live") ? (
            <>{title.replace("Live", "")}<span className={styles.liveSessionHighlight}>Live</span></>
          ) : (
            title
          )}
        </h3>
        <p className={styles.liveSessionDesc}>
          {nobodyLive
            ? "No one is streaming at the moment. We'll show them here the moment they start — or talk to an astrologer who is online now."
            : description}
        </p>
        {/* tabIndex={-1} so the card and its CTA are one tab stop, not two
            pointing at the same destination. stopPropagation keeps a mouse
            click from also firing the card handler. */}
        <button
          type="button"
          className={styles.liveSessionBtn}
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            primaryAction();
          }}
        >
          {nobodyLive ? "See who's online" : "Join Live Session"}
        </button>
        {/* Someone who would rather wait for a stream than start a chat still has
            the live page — it polls and listens for a stream starting, so waiting
            there works. Only offered in the empty state, where the button above
            no longer points at it. */}
        {nobodyLive && (
          <button
            type="button"
            className={styles.liveSessionLink}
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              goLive();
            }}
          >
            Open live sessions anyway
          </button>
        )}
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
