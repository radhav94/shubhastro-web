import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./LiveSignupPromptModal.module.scss";

/*
  Lightweight sign-up prompt shown when a GUEST tries to send a message in a
  live stream. Guests can watch, but must create an account (or log in) before
  chatting. Unlike the full GuestKundliAuthModal (kundli details + OTP), this is
  a simple prompt that routes the user to the sign-up / login screens.

  `returnTo` is passed along so the auth screens can bring the viewer back to
  the same live stream after they finish.
*/
const LiveSignupPromptModal = ({ isOpen, onClose, onSignup }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const returnTo = `${location.pathname}${location.search}`;

  const goSignup = () => {
    // Hand off to the parent, which opens the full sign-up popup
    // (GuestKundliAuthModal). Falls back to the register route if no handler.
    if (typeof onSignup === "function") {
      onSignup();
      return;
    }
    onClose?.();
    navigate("/register", { state: { from: returnTo } });
  };

  const goLogin = () => {
    onClose?.();
    navigate("/login", { state: { from: returnTo } });
  };

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign up to send your message"
    >
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Sign up to send your message</h2>
        <p className={styles.desc}>
          Create a free account to start chatting with an astrologer.
        </p>

        <button type="button" className={styles.primaryBtn} onClick={goSignup}>
          Sign Up Free
        </button>

        <p className={styles.footer}>
          Already have an account?{" "}
          <button type="button" className={styles.loginLink} onClick={goLogin}>
            Log In
          </button>
        </p>
      </div>
    </div>,
    document.body
  );
};

export default LiveSignupPromptModal;
