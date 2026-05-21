import { useState, useRef, useCallback, useEffect } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";

/**
 * Hook that manages the AI free-minutes state machine.
 * Handles activity ticks, insufficient-balance warnings, free-window renewal,
 * and reconnect state restoration.
 */
export default function useAIFreeMinutes({ isOpen, roomId }) {
  // Session billing state
  const [isFreePeriod, setIsFreePeriod] = useState(true);
  const [freeMinutesRemaining, setFreeMinutesRemaining] = useState(null);
  const [freeMinutesUsed, setFreeMinutesUsed] = useState(0);
  const [freeMinutesAllocated, setFreeMinutesAllocated] = useState(10);
  const [walletBalance, setWalletBalance] = useState(null);
  const [ratePerMinute, setRatePerMinute] = useState(null);
  const [remainingPaidTime, setRemainingPaidTime] = useState(null);
  const [dayKeyIST, setDayKeyIST] = useState(null);

  // Recharge banner state
  const [showRechargeBanner, setShowRechargeBanner] = useState(false);
  const [rechargeBannerMessage, setRechargeBannerMessage] = useState(null);
  const [minutesUntilPaid, setMinutesUntilPaid] = useState(null);
  const [minBalanceRequired, setMinBalanceRequired] = useState(null);

  // Session ended due to low balance
  const [sessionEndedLowBalance, setSessionEndedLowBalance] = useState(false);

  // Free window renewed toast
  const [freeWindowRenewed, setFreeWindowRenewed] = useState(false);

  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  // Local countdown interval for paid period (ticks every second)
  useEffect(() => {
    if (!isOpen || isFreePeriod || remainingPaidTime == null || remainingPaidTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingPaidTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isFreePeriod, remainingPaidTime > 0]);

  // Socket event handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleChatAccepted = (data) => {
      if (data?.astrologerId !== "6928390dc00d56953b586c04") return;
      // Clear previous session's recharge state
      setShowRechargeBanner(false);
      setSessionEndedLowBalance(false);
      setRechargeBannerMessage(null);
      if (data.isFreePeriod !== undefined) setIsFreePeriod(data.isFreePeriod);
      if (data.freeMinutesRemainingToday !== undefined) setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      if (data.freeMinutesUsedToday !== undefined) setFreeMinutesUsed(data.freeMinutesUsedToday);
      if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
      if (data.ratePerMinute !== undefined) setRatePerMinute(data.ratePerMinute);
      if (!data.isFreePeriod && data.remainingTime !== undefined) {
        setRemainingPaidTime(data.remainingTime * 60);
      }
    };

    const handleActivity = (data) => {
      // Only process if this is for our room or is an AI session event
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      // Update free-window state from activity tick
      if (data.isFreePeriod !== undefined) {
        setIsFreePeriod(data.isFreePeriod);
      }
      if (data.freeMinutesRemainingToday !== null && data.freeMinutesRemainingToday !== undefined) {
        setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      }
      if (data.freeMinutesUsedToday !== null && data.freeMinutesUsedToday !== undefined) {
        setFreeMinutesUsed(data.freeMinutesUsedToday);
      }
      if (data.freeMinutesAllocated !== null && data.freeMinutesAllocated !== undefined) {
        setFreeMinutesAllocated(data.freeMinutesAllocated);
      }
      if (data.dayKeyIST) {
        setDayKeyIST(data.dayKeyIST);
      }
      if (data.walletBalance !== undefined) {
        setWalletBalance(data.walletBalance);
      }
      if (data.ratePerMinute !== undefined) {
        setRatePerMinute(data.ratePerMinute);
      }
      if (!data.isFreePeriod && data.remainingTime !== undefined) {
        setRemainingPaidTime(data.remainingTime * 60);
      }

      // Auto-dismiss recharge banner if wallet is now sufficient
      if (showRechargeBanner && data.walletBalance >= data.ratePerMinute * 5) {
        setShowRechargeBanner(false);
        setMinutesUntilPaid(null);
        setMinBalanceRequired(null);
      }
    };

    const handleInsufficientBalance = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      setShowRechargeBanner(true);
      setWalletBalance(data.walletBalance);
      setRatePerMinute(data.ratePerMinute);
      if (data.minBalanceRequired !== undefined) {
        setMinBalanceRequired(data.minBalanceRequired);
      }
      if (data.minutesUntilPaid !== undefined) {
        setMinutesUntilPaid(data.minutesUntilPaid);
      }
      if (data.freeMinutesRemainingToday !== undefined) {
        setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      }
    };

    const handleChatEnded = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      if (data?.endReason === "low-balance") {
        setSessionEndedLowBalance(true);
        setShowRechargeBanner(true);
        setRechargeBannerMessage("Chat ended due to low balance. Recharge to continue.");
      }
    };

    const handleFreeWindowRenewed = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      setFreeWindowRenewed(true);
      setIsFreePeriod(true);
      setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      setDayKeyIST(data.dayKeyIST);
      // Auto-dismiss the toast after 4 seconds
      setTimeout(() => setFreeWindowRenewed(false), 4000);
    };

    const handleReconnected = (data) => {
      if (data?.roomId && roomIdRef.current && data.roomId !== roomIdRef.current) return;

      // Full state refresh from reconnect
      if (data.isFreePeriod !== undefined) setIsFreePeriod(data.isFreePeriod);
      if (data.freeMinutesUsedToday !== undefined) setFreeMinutesUsed(data.freeMinutesUsedToday);
      if (data.freeMinutesRemainingToday !== undefined) setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      if (data.freeMinutesAllocated !== undefined) setFreeMinutesAllocated(data.freeMinutesAllocated);
      if (data.dayKeyIST) setDayKeyIST(data.dayKeyIST);
      if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
      if (data.ratePerMinute !== undefined) setRatePerMinute(data.ratePerMinute);
    };

    const handleError = (data) => {
      if (data?.message?.toLowerCase().includes("insufficient balance")) {
        setShowRechargeBanner(true);
        setSessionEndedLowBalance(true);
        setRechargeBannerMessage(data.message);
      }
    };

    const handleWarning = (data) => {
      if (data?.message) {
        setShowRechargeBanner(true);
        setRechargeBannerMessage(data.message);
        // Warning doesn't end session — input should stay visible
      }
    };

    voiceSocket.on("chat:accepted", handleChatAccepted);
    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("chat:insufficient-balance", handleInsufficientBalance);
    voiceSocket.on("chat:ended", handleChatEnded);
    voiceSocket.on("chat:free-window-renewed", handleFreeWindowRenewed);
    voiceSocket.on("chat:reconnected", handleReconnected);
    voiceSocket.on("error", handleError);
    voiceSocket.on("warning", handleWarning);

    return () => {
      voiceSocket.off("chat:accepted", handleChatAccepted);
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("chat:insufficient-balance", handleInsufficientBalance);
      voiceSocket.off("chat:ended", handleChatEnded);
      voiceSocket.off("chat:free-window-renewed", handleFreeWindowRenewed);
      voiceSocket.off("chat:reconnected", handleReconnected);
      voiceSocket.off("error", handleError);
      voiceSocket.off("warning", handleWarning);
    };
  }, [isOpen, showRechargeBanner]);

  // Reset state when chat closes
  const resetFreeMinutesState = useCallback(() => {
    setShowRechargeBanner(false);
    setSessionEndedLowBalance(false);
    setFreeWindowRenewed(false);
    setMinutesUntilPaid(null);
    setMinBalanceRequired(null);
    setRemainingPaidTime(null);
  }, []);

  // Dismiss the recharge banner (user manually closes it)
  const dismissRechargeBanner = useCallback(() => {
    setShowRechargeBanner(false);
  }, []);

  return {
    // Free-period state
    isFreePeriod,
    freeMinutesRemaining,
    freeMinutesUsed,
    freeMinutesAllocated,
    dayKeyIST,

    // Paid-period state
    remainingPaidTime,
    walletBalance,
    ratePerMinute,

    // Recharge banner
    showRechargeBanner,
    rechargeBannerMessage,
    minutesUntilPaid,
    minBalanceRequired,
    dismissRechargeBanner,

    // Session end
    sessionEndedLowBalance,

    // Free window renewed
    freeWindowRenewed,

    // Reset
    resetFreeMinutesState,
  };
}
