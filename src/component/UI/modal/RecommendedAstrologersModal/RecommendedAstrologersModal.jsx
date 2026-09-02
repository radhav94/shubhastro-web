import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BsChatDots } from "react-icons/bs";
import { MdOutlinePhoneInTalk } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { ShieldCheck } from "lucide-react";
import { useGetRecommendedAstrologersQuery } from "../../../../redux/api/astrologer/astrologerApi";
import { useAstrologerConnect } from "../../../../utils/hooks/useAstrologerConnect";
import { getAstrologerDisplayName } from "../../../../utils/helper/string.utils";
import { getAstrologerImageUrl } from "../../../../utils/appImages";
import ProfileManager from "../../Profile/ProfileManager";
import { RechargeModal } from "../../..";
import PrimaryLoader from "../../PrimaryLoader";
import styles from "./RecommendedAstrologersModal.module.scss";

/** Which rate on the astrologer applies to the connection being offered. */
const rateFor = (astrologer, type) => {
  const price = astrologer?.price || {};
  if (type === "chat") return price.chatRate;
  if (type === "video") return price.videoCallRate;
  return price.audioRate;
};

/**
 * Real saving, derived from the two numbers rather than from `isDiscountActive`.
 *
 * That flag is not trustworthy on its own: dev returns astrologers with
 * `isDiscountActive: true` and `beforeDiscountPrice` equal to `amount`, which
 * would render "0% OFF — Save ₹0" and make the offer look broken. A discount
 * only exists when the earlier price is genuinely higher.
 */
const discountOf = (rate) => {
  const now = Number(rate?.amount);
  const was = Number(rate?.beforeDiscountPrice);
  if (!Number.isFinite(now) || !Number.isFinite(was) || was <= now) return null;
  return { now, was, save: was - now, percent: Math.round(((was - now) / was) * 100) };
};

/**
 * Recommended astrologers, in two presentations.
 *
 * `variant="plain"` lists them at their standard rate. `variant="offer"` is the
 * on-the-way-out version: struck-through original, percentage saved, discounted
 * rate. The sequencing between the two lives in useRecommendationOffer.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen
 * @param {'plain'|'offer'} props.variant
 * @param {'chat'|'audio'|'video'} props.type  - connection being offered
 * @param {Function} props.onDismiss - user closed it; may escalate to the offer
 * @param {Function} props.onFinish  - a connection started; close for good
 * @param {Function} [props.onNothingToOffer] - offer variant has no discounts
 * @param {Function} [props.onExitOffer] - if set, the first browser Back on the
 *   report (while this popup is closed) opens the discounted offer instead of
 *   leaving. For screens whose only back control is the browser button.
 */
const RecommendedAstrologersModal = ({
  isOpen,
  variant = "plain",
  type = "chat",
  onDismiss,
  onFinish,
  onNothingToOffer,
  onExitOffer,
  // Optional path to return to after the chat ends. Only used for chat (the
  // chat screen reads it once the session ends). Passed by screens that want
  // the user brought back to them — currently the Muhurat report.
  returnTo = null,
}) => {
  const isOffer = variant === "offer";
  const trackRef = useRef(null);
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useGetRecommendedAstrologersQuery(
    { type, discount: isOffer, page: 1, limit: 10 },
    { skip: !isOpen }
  );

  const {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect,
    openModal,
    setOpenModal,
  } = useAstrologerConnect();

  const [selectedAstrologer, setSelectedAstrologer] = useState(null);

  const astrologers = useMemo(() => {
    const list = data?.data || [];
    // In the offer variant, anyone without a genuine discount has nothing to
    // offer — showing them here would undercut the whole point of the screen.
    if (!isOffer) return list;
    return list.filter((a) => discountOf(rateFor(a, type)));
  }, [data, isOffer, type]);

  /*
    The offer stage is conditional on there being an actual offer. When the
    filter above leaves nothing, close instead of presenting an empty
    "before you go" panel — the user pressed the close button and is entitled to
    have it work.
  */
  const settled = isOpen && !isLoading && !isFetching;
  useEffect(() => {
    if (settled && isOffer && astrologers.length === 0) onNothingToOffer?.();
  }, [settled, isOffer, astrologers.length, onNothingToOffer]);

  // Reset the carousel whenever the panel opens or switches variant, so the
  // offer never starts halfway along the previous stage's scroll position.
  useEffect(() => {
    setPage(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [isOpen, variant]);

  /*
    Make the Back button (browser Back, a swipe-back gesture, and the report's
    own back button, which calls navigate(-1)) close the popup instead of leaving
    the page — while the popup is showing.

      - the FIRST Back on the plain list escalates it to the discounted offer;
      - a Back on the offer closes the popup;
      - a Back when the popup is not showing does nothing special (normal nav).

    Implemented with a single, long-lived popstate listener plus a guard history
    entry pushed whenever the popup shows. Earlier attempts re-subscribed the
    listener on every variant change and popped the entry in cleanup with
    history.back(); a stray cleanup then navigated the page back on its own,
    which is the "page goes back by itself" bug this avoids.
  */
  const trapActive = isOpen && !openModal.kundli;

  // Keep the latest dismiss handler in a ref so the single, long-lived popstate
  // listener always calls the current one without re-subscribing (re-subscribing
  // is what previously let a stray cleanup fire history.back() and send the page
  // back on its own).
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const trapActiveRef = useRef(trapActive);
  trapActiveRef.current = trapActive;

  // Exit-intent: when a screen passes `onExitOffer`, the FIRST browser Back on
  // the report (while the popup is closed) opens the discounted offer instead of
  // leaving — same behaviour Rashi gives its in-page back button, but for the
  // screens (Muhurat, Face) whose only "back" is the browser button. Fired at
  // most once per mount; after that Back leaves the report normally.
  const onExitOfferRef = useRef(onExitOffer);
  onExitOfferRef.current = onExitOffer;
  const exitOfferSpentRef = useRef(false);

  // A single listener for the whole life of the component. It only reacts when
  // the popup is actually showing (step back inside it), or — for the exit-intent
  // case — the first time Back is pressed while the popup is closed.
  useEffect(() => {
    const onPopState = () => {
      if (trapActiveRef.current) {
        // Popup showing: consume the Back and step back inside it. Re-arm
        // immediately so the NEXT Back (e.g. on the offer stage) is caught too.
        window.history.pushState({ recommendedModal: true }, "");
        onDismissRef.current?.(); // escalate plain -> offer, or close the offer
        return;
      }
      // Popup closed. If this screen wants an exit-intent offer and we haven't
      // shown it yet, open it now and swallow this Back.
      if (onExitOfferRef.current && !exitOfferSpentRef.current) {
        exitOfferSpentRef.current = true;
        window.history.pushState({ recommendedModal: true }, "");
        onExitOfferRef.current(); // opens the discounted offer stage
        return;
      }
      // Nothing to do -> let the Back navigate away.
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Arm a guard entry:
  //  - whenever the popup shows, so the first Back has something to consume;
  //  - and, for the exit-intent case, once on mount while it's still closed, so
  //    the very first Back on the report is caught rather than leaving.
  useEffect(() => {
    if (trapActive) window.history.pushState({ recommendedModal: true }, "");
  }, [trapActive]);
  useEffect(() => {
    if (onExitOffer && !exitOfferSpentRef.current) {
      window.history.pushState({ recommendedModal: true }, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]");
    const step = card ? card.offsetWidth + 16 : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const onTrackScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]");
    const step = card ? card.offsetWidth + 16 : 1;
    setPage(Math.round(track.scrollLeft / step));
  };

  const connect = (astrologer) => {
    setSelectedAstrologer(astrologer);
    // The hook may still need a kundli or a recharge before anything happens,
    // and it drives those through `openModal`. Either way the user has committed
    // to connecting, so the recommendation panel is done — and must not come
    // back as the "before you go" offer on top of the connecting screen.
    /*
      Argument order is not the same for the two, and getting it wrong here is
      silent: handleChatStart(astro, checkBalance, isEmergency) but
      handleCallStart(astro, type, isEmergency). Passing `true` third on the call
      path would flag it as an emergency session, not "check the balance".
    */
    if (type === "chat") {
      // Remember where to send the user once the chat ends. The chat launch is
      // a full-page navigation, so router state would be lost — persist it.
      if (returnTo) {
        try { sessionStorage.setItem("shubhtalk_chat_return_path", returnTo); } catch { /* ignore */ }
      }
      handleChatStart(astrologer, true, false);
    } else {
      handleCallStart(astrologer, type === "video" ? "video" : "audio");
    }
    onFinish?.();
  };

  if (!isOpen) return null;

  const heading = isOffer
    ? "Before you go, meet astrologers matched to your report"
    : "Recommended astrologers for you";
  const subheading = isOffer
    ? "Based on your reading and current availability."
    : "Based on your report and current availability";

  const pageCount = astrologers.length;

  // Narrow the panel when only one or two astrologers are shown, so the cards
  // aren't stranded in a wide, mostly-empty modal.
  const widthClass =
    pageCount === 1 ? styles.modalOne : pageCount === 2 ? styles.modalTwo : "";

  return (
    <>
      {/* Hidden, not unmounted, while the kundli picker is up: unmounting would
          tear down the connect hook mid-flow.

          Portaled to <body> so the fixed overlay is positioned against the
          viewport, not a transformed/clipped ancestor in the report tree — that
          ancestor stacking context was what let the app header paint over the
          modal's top and pushed it off-centre. */}
      {!openModal.kundli && createPortal(
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={`${styles.modal} ${isOffer ? styles.offerModal : ""} ${widthClass}`}>
            <header className={styles.header}>
              <span className={styles.headerIcon} aria-hidden="true">
                {type === "chat" ? (
                  <BsChatDots size={18} />
                ) : (
                  <MdOutlinePhoneInTalk size={18} />
                )}
              </span>
              <div className={styles.headerText}>
                <h3>{heading}</h3>
                <p>{subheading}</p>
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => (onFinish || onDismiss)?.()}
                aria-label="Close"
              >
                <IoClose size={20} />
              </button>
            </header>

            {isLoading ? (
              <div className={styles.loaderWrap}>
                <PrimaryLoader isLoading />
              </div>
            ) : pageCount === 0 ? (
              <p className={styles.empty}>
                No astrologers are available right now. Please try again shortly.
              </p>
            ) : (
              <div className={styles.carousel}>
                {pageCount > 1 && (
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowPrev}`}
                    onClick={() => scrollByCard(-1)}
                    aria-label="Previous astrologers"
                  >
                    <FiChevronLeft size={18} />
                  </button>
                )}

                <ul className={styles.track} ref={trackRef} onScroll={onTrackScroll}>
                  {astrologers.map((astrologer, index) => {
                    const rate = rateFor(astrologer, type);
                    const discount = discountOf(rate);
                    // `languagePreferences: [{ languageName, proficiencyLevel }]`
                    // is the shape the other astrologer cards read. Capped at two
                    // because the card is 208px wide and these astrologers list
                    // four or five.
                    const languages = (astrologer.languagePreferences || [])
                      .map((l) => l?.languageName)
                      .filter(Boolean)
                      .slice(0, 2);
                    return (
                      <li
                        data-card
                        key={astrologer._id}
                        className={`${styles.card} ${index === 0 ? styles.bestMatch : ""}`}
                      >
                        {index === 0 && (
                          <span className={styles.bestBadge}>★ Best Match</span>
                        )}

                        {/* The field is `profileImgUrl` / `profileImages`, not
                            `profileImage` — and the helper walks the whole chain
                            (sized variant -> legacy url -> gendered default), so
                            a record missing the new shape still gets a face
                            rather than a broken image. "small" is the 100x125
                            derivative, which is right for a 72px avatar. */}
                        <img
                          className={styles.avatar}
                          src={getAstrologerImageUrl(astrologer, "small")}
                          alt=""
                          loading="lazy"
                        />
                        <h4 className={styles.name}>
                          {getAstrologerDisplayName(astrologer)}
                        </h4>
                        <p className={styles.meta}>
                          <FaStar size={11} className={styles.metaStar} aria-hidden="true" />
                          {Number(astrologer.averageRating || astrologer.rating || 0).toFixed(1)}
                          {astrologer.experience ? ` · ${astrologer.experience} yrs exp.` : ""}
                        </p>

                        {languages.length > 0 && (
                          <p className={styles.langRow}>
                            {languages.map((lang) => (
                              <span key={lang} className={styles.lang}>
                                {lang}
                              </span>
                            ))}
                          </p>
                        )}

                        <div className={styles.priceBlock}>
                          {isOffer && discount ? (
                            /*
                              Laid out across rather than down: the discount
                              detail sits beside the price, not stacked under it,
                              so the offer card is the same height as the plain
                              one and the panel does not grow when the stage
                              changes. The card takes the extra room in width.
                            */
                            <>
                              <span className={styles.nowPrice}>
                                ₹{discount.now}
                                <small>/min</small>
                              </span>
                              <span className={styles.priceAside}>
                                <s className={styles.wasPrice}>₹{discount.was}/min</s>
                                <span className={styles.badgeRow}>
                                  <span className={styles.offBadge}>
                                    {discount.percent}% OFF
                                  </span>
                                  <span className={styles.saveBadge}>
                                    Save ₹{discount.save}
                                  </span>
                                </span>
                              </span>
                            </>
                          ) : (
                            <span className={styles.nowPrice}>
                              {/* Plain stage deliberately quotes the pre-discount
                                  rate — the discount is what the offer stage has
                                  left to reveal. */}
                              ₹{discount ? discount.was : rate?.amount ?? "--"}
                              <small>/min</small>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className={styles.connectBtn}
                          onClick={() => connect(astrologer)}
                        >
                          {type === "chat" ? (
                            <>
                              <BsChatDots size={14} aria-hidden="true" /> Chat
                            </>
                          ) : (
                            <>
                              <MdOutlinePhoneInTalk size={15} aria-hidden="true" /> Call
                            </>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {pageCount > 1 && (
                  <button
                    type="button"
                    className={`${styles.arrow} ${styles.arrowNext}`}
                    onClick={() => scrollByCard(1)}
                    aria-label="More astrologers"
                  >
                    <FiChevronRight size={18} />
                  </button>
                )}
              </div>
            )}

            {pageCount > 1 && (
              <div className={styles.dots} aria-hidden="true">
                {astrologers.map((a, i) => (
                  <span
                    key={a._id}
                    className={i === page ? styles.dotOn : styles.dot}
                  />
                ))}
              </div>
            )}

            <footer className={styles.trustBar}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span>100% Secure</span>
              <i aria-hidden="true">•</i>
              <span>Verified Astrologers</span>
              <i aria-hidden="true">•</i>
              <span>Private &amp; Confidential</span>
            </footer>
          </div>
        </div>,
        document.body
      )}

      <ProfileManager
        isOpen={openModal.kundli}
        onClose={() => setOpenModal((prev) => ({ ...prev, kundli: false }))}
        startCallMode
        onStartCall={handleAfterKundliSelect}
        title="Select Profile to Continue"
        enabledOperations={{ list: true, add: true, edit: true, delete: true }}
      />

      <RechargeModal
        isOpen={openModal.recharge}
        onClose={() => setOpenModal((prev) => ({ ...prev, recharge: false }))}
        astrologer={selectedAstrologer}
        connectionType={type === "chat" ? "chat" : "call"}
      />
    </>
  );
};

export default RecommendedAstrologersModal;
