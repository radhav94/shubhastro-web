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
import { Toast } from "../../..";
import RechargeModal from "../RechargeModal/RechargeModal";
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
 * @param {Function} [props.onEmergencyAvailable] - astrologer is offline but
 *        bookable as an emergency session. Host screens that own an emergency
 *        modal pass this; without it the press falls back to a message rather
 *        than doing nothing.
 */
const RecommendedAstrologersModal = ({
  isOpen,
  variant = "plain",
  type = "chat",
  onDismiss,
  onFinish,
  onNothingToOffer,
  onExitOffer,
  // Called when the user closes the popup while it is on the discounted OFFER
  // stage (via the close button or a Back). Host screens pass this to leave the
  // report on that close — so "Back opens the offer, closing the offer takes you
  // back" is a single flow. Not called when a connection is starting (onFinish)
  // or when the plain list escalates to the offer (onDismiss).
  onExitClose,
  onEmergencyAvailable,
  // Optional path to return to after the chat ends. Only used for chat (the
  // chat screen reads it once the session ends). Passed by screens that want
  // the user brought back to them — currently the Muhurat report.
  returnTo = null,
}) => {
  const isOffer = variant === "offer";
  const trackRef = useRef(null);

  const { data, isLoading, isFetching } = useGetRecommendedAstrologersQuery(
    { type, discount: isOffer, page: 1, limit: 10 },
    { skip: !isOpen }
  );

  const {
    handleChatStart,
    handleCallStart,
    handleAfterKundliSelect,
    isConnecting,
    openModal,
    setOpenModal,
  } = useAstrologerConnect();

  /** The connection type as the connect hook keys it. */
  const connectType = type === "chat" ? "chat" : type === "video" ? "video" : "audio";

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
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const trapActiveRef = useRef(trapActive);
  trapActiveRef.current = trapActive;

  // Latest offer-stage close handler + current stage, read by the long-lived
  // popstate listener without re-subscribing.
  const isOfferRef = useRef(isOffer);
  isOfferRef.current = isOffer;
  const onExitCloseRef = useRef(onExitClose);
  onExitCloseRef.current = onExitClose;

  /*
    A user-initiated close of the popup (close button or Back).

    On the OFFER stage, closing means "I'm done, take me back to the page before
    the report". We do the history navigation HERE rather than in the host,
    because only this component knows whether it has a guard entry sitting on top
    of the stack: when the popup is open there is one (armed to catch a Back), so
    leaving the report is two steps back (guard + report), otherwise one. Doing
    it in the host with navigate(-1) landed on our own guard entry — the report
    stayed put, which is the "close doesn't go back" bug. `onExitClose` is now a
    notification the host can use (e.g. analytics); the actual navigation is
    ours.

    On the PLAIN stage, closing escalates to the offer (onDismiss), unchanged.
  */
  const handleUserClose = () => {
    if (isOfferRef.current && onExitCloseRef.current) {
      const steps = guardArmedRef.current ? -2 : -1;
      guardArmedRef.current = false;
      onExitCloseRef.current(); // host notification (navigation handled below)
      window.history.go(steps); // leave the report -> the page before it
      return;
    }
    // Plain stage: closing just closes the popup (no escalation to the
    // discounted offer). `onFinish` closes without advancing the stage;
    // `onDismiss` is the fallback for hosts that don't pass onFinish.
    (onFinishRef.current || onDismissRef.current)?.();
  };
  const handleUserCloseRef = useRef(handleUserClose);
  handleUserCloseRef.current = handleUserClose;

  // Exit-intent: when a screen passes `onExitOffer`, the FIRST browser Back on
  // the report (while the popup is closed) opens the discounted offer instead of
  // leaving — same behaviour Rashi gives its in-page back button, but for the
  // screens (Muhurat, Face) whose only "back" is the browser button. Fired at
  // most once per mount; after that Back leaves the report normally.
  const onExitOfferRef = useRef(onExitOffer);
  onExitOfferRef.current = onExitOffer;
  const exitOfferSpentRef = useRef(false);

  /*
    Whether a single guard history entry is currently armed. We keep at most ONE
    at a time: arming more (or re-pushing on every popstate, or popping with
    history.back()) thrashes the History API and trips the browser's "Throttling
    navigation to prevent the browser from hanging" protection — after which
    history operations silently no-op, which is exactly why closing the popup
    stopped taking the user back.
  */
  const guardArmedRef = useRef(false);

  const armGuard = () => {
    if (guardArmedRef.current) return;
    window.history.pushState({ recommendedModal: true }, "");
    guardArmedRef.current = true;
  };

  // A single listener for the whole life of the component. It reacts only when
  // the popup is showing (step back inside / close it), or — for the exit-intent
  // case — the first Back pressed while the popup is closed.
  useEffect(() => {
    const onPopState = () => {
      // The Back just consumed our guard entry.
      guardArmedRef.current = false;

      if (trapActiveRef.current) {
        // Both stages: a Back closes the popup (plain -> plain close; offer ->
        // onExitClose navigates away). Neither re-arms the guard.
        handleUserCloseRef.current();
        return;
      }
      // Popup closed. First Back with an exit-intent offer pending -> open it.
      if (onExitOfferRef.current && !exitOfferSpentRef.current) {
        exitOfferSpentRef.current = true;
        armGuard();
        onExitOfferRef.current();
        return;
      }
      // Nothing to do -> let the Back navigate away.
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Arm a single guard entry whenever the popup shows, so a browser Back has
  // something to consume. We never pop it here: popping with history.back() is
  // what caused the navigation-throttling loop. A leftover guard (popup closed
  // some other way) is harmlessly consumed by the user's next Back.
  useEffect(() => {
    if (trapActive) armGuard();
  }, [trapActive]);

  // Exit-intent screens: arm one guard on mount (while closed) so the very first
  // browser Back is caught and opens the offer instead of leaving.
  useEffect(() => {
    if (onExitOffer && !exitOfferSpentRef.current) armGuard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]");
    const step = card ? card.offsetWidth + 16 : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  /*
    Connect, then decide what to do with the panel — in that order.

    This used to call the handler fire-and-forget and then onFinish() on the very
    next line, which closed the panel while the balance / availability round trip
    was still in flight. Two separate failures came out of that:

      * The panel vanished instantly with nothing to replace it, so for the whole
        length of the request the screen simply went back to the report.
      * `isOpen` gates this entire component (`if (!isOpen) return ...` below), and
        the RechargeModal and kundli picker are rendered *inside* it. The connect
        hook opens those through `setOpenModal` only after its await resolves — by
        which point the gate had already closed and they could never paint. An
        insufficient balance therefore produced no recharge sheet at all.

    Net effect for the visitor: press Call, panel disappears, nothing arrives. The
    only move left is to go back and press Call again. Clarity caught precisely
    that on the Rashi report — Call/Chat pressed over and over between 20:26 and
    21:13. The follow-up modals now live outside the gate (see followUpModals) and
    the close waits for an outcome.

    Argument order differs between the two handlers and getting it wrong is
    silent: handleChatStart(astro, checkBalance, isEmergency) but
    handleCallStart(astro, type, isEmergency). Passing `true` third on the call
    path would flag an emergency session rather than "check the balance".
  */
  const connect = async (astrologer) => {
    setSelectedAstrologer(astrologer);

    let result;
    try {
      if (type === "chat") {
        // Remember where to send the user once the chat ends. The chat launch is
        // a full-page navigation, so router state would be lost — persist it.
        if (returnTo) {
          try { sessionStorage.setItem("shubhtalk_chat_return_path", returnTo); } catch { /* ignore */ }
        }
        result = await handleChatStart(astrologer, true, false);
      } else {
        result = await handleCallStart(astrologer, connectType);
      }
    } catch (err) {
      // An unexpected throw must not be the one path that still says nothing.
      console.error("Recommended astrologer connect failed:", err);
      onFinish?.();
      Toast.error("Couldn't start that session. Please try again.");
      return;
    }

    /*
      Offline astrologer that can still be booked as an emergency session. Every
      other caller of these handlers checks this flag and opens its emergency
      modal; this one dropped the return value on the floor, so the press did
      nothing at all — the same defect already documented on the Profile screen.
      Delegate when the host screen owns an emergency modal, and never go silent
      when it doesn't.
    */
    if (result?.emergencyAvailable) {
      onFinish?.();
      if (onEmergencyAvailable) {
        onEmergencyAvailable(astrologer);
      } else {
        Toast.info(
          `${getAstrologerDisplayName(astrologer)} is offline right now. Please choose another astrologer.`
        );
      }
      return;
    }

    /*
      Close on success (a connection is under way, so the "before you go" offer
      must not land on top of the connecting screen) and also on a handled
      failure — the hook has already surfaced a Toast or opened the recharge
      sheet, and those read better without this panel stacked over them.
    */
    onFinish?.();
  };

  /*
    Rendered regardless of `isOpen`.

    Both of these are opened by the connect hook *after* its await resolves, which
    is after this panel has closed. While they lived behind the `isOpen` early
    return they were unmountable by definition: the recharge sheet for a visitor
    with an empty wallet never appeared, which is what turned Call/Chat into a
    dead press. They are self-gating on `openModal.*`, so rendering them while the
    panel is shut costs nothing.
  */
  const followUpModals = (
    <>
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

  if (!isOpen) return followUpModals;

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
                onClick={() => handleUserClose()}
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

                <ul className={styles.track} ref={trackRef}>
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

                        {/*
                          Never `disabled` — a disabled button swallows the press
                          and reports nothing, which is the failure mode this
                          whole change is undoing. The panel now stays up while
                          the balance check runs, so the tapped card says so;
                          repeat presses are answered by the connect hook's
                          in-flight guard.
                        */}
                        <button
                          type="button"
                          className={styles.connectBtn}
                          onClick={() => connect(astrologer)}
                          aria-busy={isConnecting(astrologer._id, connectType)}
                        >
                          {isConnecting(astrologer._id, connectType) ? (
                            "Connecting…"
                          ) : type === "chat" ? (
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

      {followUpModals}
    </>
  );
};

export default RecommendedAstrologersModal;
