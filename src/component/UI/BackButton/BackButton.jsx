import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./BackButton.module.scss";

const BackButton = ({ onClick, fallbackPath = "/", disabled = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (disabled) return;
    if (onClick) {
      onClick();
      return;
    }

    // `window.history.length > 1` was the wrong signal: it counts every entry in
    // the tab's session, including cross-origin ones. A Google Ads click-through
    // arrives with a redirect chain behind it (google.com -> googleadservices ->
    // here), so the check passed and `navigate(-1)` sent the visitor back into an
    // ad redirector — which either bounces them forward again or drops them out
    // of the site entirely. Either way the back button did nothing useful on
    // exactly the traffic we pay for.
    //
    // React Router stamps the first entry of a session with key "default", so
    // this is a reliable test for "did the user navigate here from inside the
    // app". When they didn't, go to the fallback (the homepage) — a real
    // destination — instead of walking off the origin.
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  return (
    <div className={styles.backBar}>
      <div className={styles.backBtnInner}>
        <button
          className={styles.backBtn}
          onClick={handleBack}
          aria-label="Go back"
          disabled={disabled}
          style={disabled ? { opacity: 0.5, cursor: "not-allowed", pointerEvents: "none" } : undefined}
        >
          <ChevronLeft size={22} />
        </button>
      </div>
    </div>
  );
};

export default BackButton;
