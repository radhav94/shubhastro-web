import { useEffect, useState, useRef, memo } from "react";
import styles from "./OtpModal.module.scss";

// Isolated timer to prevent re-rendering the OTP inputs every second
const ResendCountdown = memo(({ isOpen, onResend }) => {
  const [counter, setCounter] = useState(60);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCounter(60);
      setIsActive(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isActive || counter <= 0) {
      if (isActive && counter <= 0) setIsActive(false);
      return;
    }
    const timer = setTimeout(() => setCounter(counter - 1), 1000);
    return () => clearTimeout(timer);
  }, [counter, isActive, isOpen]);

  const handleResend = async () => {
    if (isActive) return;
    try {
      await onResend?.();
      setIsActive(true);
      setCounter(60);
    } catch { /* parent surfaces the error */ }
  };

  return (
    <div className={styles.resendRow}>
      {isActive ? (
        <span className={styles.timer}>
          Resend OTP in {Math.floor(counter / 60)}:{String(counter % 60).padStart(2, "0")}
        </span>
      ) : (
        <button type="button" className={styles.resendBtn} onClick={handleResend}>
          Resend OTP
        </button>
      )}
    </div>
  );
});

/**
 * Lightweight OTP verification popup.
 *
 * Presentational only — the parent owns the verify/resend network calls.
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
  const inputRef = useRef(null);

  const isOtpComplete = otp.length === 6;

  const displayNumber =
    typeof phoneNumber === "string" && phoneNumber.startsWith("91")
      ? phoneNumber.slice(2)
      : phoneNumber;

  const verify = async () => {
    if (isVerifying || !isOtpComplete) return;
    const success = await onVerify(otp);
    if (!success) {
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Auto-submit once the OTP is fully entered
  useEffect(() => {
    if (isOtpComplete && !isVerifying) {
      // Small delay to show the last digit before submitting
      const timer = setTimeout(() => verify(), 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleResend = async () => {
    await onResend?.();
    setOtp("");
    setTimeout(() => inputRef.current?.focus(), 50);
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
          <div
            className={styles.otpInputContainer}
            onClick={() => inputRef.current?.focus()}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`${styles.otpBox} ${otp.length === i ? styles.otpBoxActive : ""} ${otp[i] ? styles.otpBoxFilled : ""}`}
              >
                {otp[i] || ""}
              </div>
            ))}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={styles.otpHiddenInput}
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                setOtp(val);
              }}
              maxLength={6}
              autoFocus
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

        <ResendCountdown isOpen={isOpen} onResend={handleResend} />
      </div>
    </div>
  );
};

export default OtpModal;
