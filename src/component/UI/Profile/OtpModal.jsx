import { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import styles from "./OtpModal.module.scss";

/**
 * Lightweight OTP verification popup.
 *
 * Presentational only — the parent owns the verify/resend network calls.
 *
 * @param {boolean} isOpen
 * @param {string} phoneNumber - full phone number (e.g. "919876543210"); shown to the user
 * @param {(otp: string) => Promise<boolean>} onVerify - resolve true on success, false/throw on failure
 * @param {() => Promise<void>} onResend
 * @param {() => void} onClose
 * @param {boolean} isVerifying - controlled loading state from the parent
 */
const OtpModal = ({
  isOpen,
  phoneNumber,
  onVerify,
  onResend,
  onClose,
  isVerifying = false,
  closeOnOverlayClick = true,
}) => {
  const [otp, setOtp] = useState("");
  const [counter, setCounter] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(true);

  const isOtpComplete = otp.length === 6;

  // Display the number without the leading "91" country code when present.
  const displayNumber =
    typeof phoneNumber === "string" && phoneNumber.startsWith("91")
      ? phoneNumber.slice(2)
      : phoneNumber;

  const verify = async () => {
    if (isVerifying || !isOtpComplete) return;
    const success = await onVerify(otp);
    if (!success) {
      setOtp("");
    }
  };

  // Auto-submit once the OTP is fully entered (SMS autofill).
  useEffect(() => {
    if (isOtpComplete && !isVerifying) {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Reset state whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setCounter(60);
      setIsTimerActive(true);
    }
  }, [isOpen]);

  // Countdown timer.
  useEffect(() => {
    if (!isOpen || !isTimerActive || counter <= 0) {
      if (isTimerActive && counter <= 0) setIsTimerActive(false);
      return;
    }
    const timer = setTimeout(() => setCounter(counter - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter, isTimerActive, isOpen]);

  const handleResend = async () => {
    if (isTimerActive) return;
    try {
      await onResend?.();
      setOtp("");
      setIsTimerActive(true);
      setCounter(60);
    } catch {
      /* parent surfaces the error */
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className={styles.title}>Verify OTP</h2>
        <p className={styles.subtitle}>
          Enter the 6-digit code sent via SMS to
          <br />
          <strong className="notranslate">+91 {displayNumber}</strong>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <div className={styles.otpInputContainer}>
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              inputType="tel"
              shouldAutoFocus
              renderInput={(props) => (
                <input {...props} className={styles.otpInput} />
              )}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!isOtpComplete || isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <div className={styles.resendRow}>
          {isTimerActive ? (
            <span className={styles.timer}>
              Resend OTP in {Math.floor(counter / 60)}:
              {String(counter % 60).padStart(2, "0")}
            </span>
          ) : (
            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
