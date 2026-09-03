import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./WelcomeBonusModal.module.scss";
import { IoClose } from "react-icons/io5";
import welcomeBg from "../../../../assets/images/welcome-bonus-bg.webp";
import welcomeBgMobile from "../../../../assets/images/welcome-bonus-bg-mobile.webp";
import welcomeIcon from "../../../../assets/images/welcome-bonus-icon.webp";
import { useWalletBalance } from "../../../../screens/private/wallet/useWalletBalance";

const WelcomeBonusModal = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  // Use the same wallet-balance source as the header so the amount matches what
  // the app shows (it persists to localStorage and refreshes on wallet events).
  const { balance, refreshWallet } = useWalletBalance();

  // Show the bonus whenever the flag is set. Checked on mount, on every
  // navigation, AND when explicitly triggered via a custom event (so it appears
  // immediately after guest registration without requiring a route change).
  const checkAndShowBonus = () => {
    if (localStorage.getItem("shubhtalk_show_welcome_bonus") === "true") {
      localStorage.removeItem("shubhtalk_show_welcome_bonus");
      setIsOpen(true);
    }
  };

  useEffect(() => {
    checkAndShowBonus();
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener("show-welcome-bonus", checkAndShowBonus);
    return () => window.removeEventListener("show-welcome-bonus", checkAndShowBonus);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Pull the latest balance so the just-credited welcome bonus is reflected.
      refreshWallet();
    }
  }, [isOpen, refreshWallet]);

  /*
    Auto-hide.

    This was 5s, which is less time than it takes to read six lines of copy
    ("Welcome to ShubhAstro", the title, the amount, the badge, the description)
    and then reach for "Start Exploring". The modal unmounted mid-reach and the
    tap landed on the page behind it — a dead click, and one that costs the
    visitor the CTA at the exact moment they were converting.

    Now AUTO_HIDE_MS below, and cancelled outright the moment the visitor touches
    the overlay, so it can never race a finger that is already moving. The full
    account of why the delay matters — and of the long stretch where this comment
    claimed a value the code did not have — is on AUTO_HIDE_MS itself.
  */
  const [autoHideCancelled, setAutoHideCancelled] = useState(false);

  /*
    The 10s the comment above describes.

    It sat at 5000 for a long time: the reasoning was written, the correction was
    written, and the number itself was never changed — so every visitor kept
    getting exactly the 5s window that reasoning exists to remove. Two comment
    blocks described a 10s auto-hide that did not exist. Now it does.

    Why 5s was actively expensive rather than merely tight. `handleClose` is not
    just "hide the popup": it dispatches "welcome-bonus-closed", and
    GuestChatFlow listens for that and then runs a balance check, calls
    initiateChat() and does navigate("/astrologers", { replace: true }). So the
    timer did not only remove "Start Exploring" from under a finger already
    reaching for it — it moved the visitor to a different route mid-read, and the
    tap landed on whatever /astrologers had rendered in its place. A dead click
    at the precise moment of conversion.

    Clarity has recorded this shape three times: a guest from Facebook who
    completed the whole chat onboarding and whose tap on "Start Exploring" at
    02:12 was a dead click; session 1f4jx7j (Sep 3, Facebook in-app, mobile)
    claiming a ₹250 credit at 09:24 on the way into a chat; and session gwh8dh
    (Sep 3, Threads/Meta ad, mobile Chrome) which is the clearest of the three —
    verification completed at 03:28, exit page /astrologers, session over at
    03:40. Twelve seconds, which is the 5s timer plus the time it takes to
    realise the screen changed under you.

    That last session is also a caution about reading these summaries. Clarity's
    narrative ends "proceeded to explore astrologer listings again", which sounds
    like intent. It was not: navigate("/astrologers", { replace: true }) is what
    this timer does. The visitor did not go to the listings, they were sent
    there.

    The `pointerDownCapture` handler on the overlay cannot cover this. It only
    protects a tap already in progress when the timer fires; a tap that begins
    after the modal has gone has nothing left to cancel. Only giving the reader
    enough time does.

    Interaction with the guest signup flow, re-verified rather than assumed:
    GuestKundliAuthModal awaits "welcome-bonus-closed" behind a 6000ms safety
    timeout (GuestKundliAuthModal.jsx, still there). At 10s that safety timeout
    resolves the wait first, which is fine — it only unblocks that function's own
    continuation, and this modal sits at z-index 99999 so it stays on top while
    the screen behind it settles.
  */
  const AUTO_HIDE_MS = 10000;

  useEffect(() => {
    if (!isOpen || autoHideCancelled) return undefined;
    const timer = setTimeout(() => handleClose(), AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [isOpen, autoHideCancelled]);

  const handleClose = () => {
    setIsOpen(false);
    setAutoHideCancelled(false);
    // Notify listeners (e.g. GuestKundliAuthModal) that the popup has been dismissed.
    window.dispatchEvent(new Event("welcome-bonus-closed"));
  };

  // Escape closes it. There was no key handling here at all.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const amount = balance ?? 0;

  if (!isOpen) return null;

  return (
    /*
      The overlay is `position: fixed; inset: 0` with a 0.6 black scrim, and the
      card is capped at 360px on phones — so most of what the visitor can see and
      touch was this element, and it had no handler at all. Tapping the dim area
      to dismiss is the near-universal gesture for a popup like this; it did
      nothing. The target check keeps a click that started inside the card from
      being read as "clicked outside".

      pointerDownCapture cancels the auto-hide before the click resolves, so a tap
      anywhere here — including one that lands on the card or the CTA — stops the
      timer from firing underneath it.
    */
    <div
      className={styles.overlay}
      onPointerDownCapture={() => setAutoHideCancelled(true)}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <IoClose size={22} />
        </button>
        <div className={styles.bgWrapper}>
          <img src={welcomeBg} alt="" className={`${styles.bgImage} ${styles.bgDesktop}`} />
          <img src={welcomeBgMobile} alt="" className={`${styles.bgImage} ${styles.bgMobile}`} />
        </div>
        <div className={styles.content}>
          <img src={welcomeIcon} alt="Bonus" className={styles.icon} />
          <p className={styles.welcome}>Welcome to ShubhAstro!</p>
          <h2 className={styles.title}>A Little Gift From Us</h2>
          <p className={styles.amount}>₹{amount}</p>
          <div className={styles.badge}>
            Welcome bonus added to your wallet
          </div>
          <p className={styles.desc}>
            Use it to talk to expert astrologers & begin your cosmic journey.
          </p>
          <button className={styles.doneBtn} onClick={handleClose}>
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBonusModal;
