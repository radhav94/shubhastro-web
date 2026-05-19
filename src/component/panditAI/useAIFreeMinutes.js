import { useState, useRef, useCallback, useEffect } from "react";
import { voiceSocket } from "../../services/voiceSocketServices";
import { useLazyGetAIAstrologerUsageQuery } from "../../redux/api/aiAstrologerApi";
import { PANDIT_AI_ID } from "./usePanditAI";

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
  const [minutesUntilPaid, setMinutesUntilPaid] = useState(null);
  const [minBalanceRequired, setMinBalanceRequired] = useState(null);

  // Session ended due to low balance
  const [sessionEndedLowBalance, setSessionEndedLowBalance] = useState(false);

  // Free window renewed toast
  const [freeWindowRenewed, setFreeWindowRenewed] = useState(false);

  // Pre-chat usage check
  const [canStartChat, setCanStartChat] = useState(null);
  const [cantStartReason, setCantStartReason] = useState(null);

  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  const [fetchUsage] = useLazyGetAIAstrologerUsageQuery();

  // Fetch usage on mount to determine if user can start chat
  const checkUsage = useCallback(async () => {
    try {
      const result = await fetchUsage({ astrologerId: PANDIT_AI_ID }).unwrap();
      const data = result?.data || result;
      setCanStartChat(data.canStartChat);
      setCantStartReason(data.reason);
      setWalletBalance(data.walletBalance);
      setRatePerMinute(data.ratePerMinute);
      setFreeMinutesRemaining(data.freeMinutesRemainingToday);
      setFreeMinutesUsed(data.freeMinutesUsedToday);
      setDayKeyIST(data.dayKeyIST);
      if (data.freeMinutesRemainingToday === 0) {
        setIsFreePeriod(false);
      }
      if (data.needsRecharge) {
        setShowRechargeBanner(true);
        if (data.minBalanceRequired !== undefined) {
          setMinBalanceRequired(data.minBalanceRequired);
        }
      }
      return data;
    } catch {
      // If the endpoint fails, allow chat to proceed (graceful degradation)
      setCanStartChat(true);
      return null;
    }
  }, [fetchUsage]);

  useEffect(() => {
    if (isOpen) {
      checkUsage();
    }
  }, [isOpen, checkUsage]);

  // Socket event handlers
  useEffect(() => {
    if (!isOpen) return;

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
        setRemainingPaidTime(data.remainingTime);
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
        setShowRechargeBanner(false);
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

    voiceSocket.on("activity", handleActivity);
    voiceSocket.on("chat:insufficient-balance", handleInsufficientBalance);
    voiceSocket.on("chat:ended", handleChatEnded);
    voiceSocket.on("chat:free-window-renewed", handleFreeWindowRenewed);
    voiceSocket.on("chat:reconnected", handleReconnected);

    return () => {
      voiceSocket.off("activity", handleActivity);
      voiceSocket.off("chat:insufficient-balance", handleInsufficientBalance);
      voiceSocket.off("chat:ended", handleChatEnded);
      voiceSocket.off("chat:free-window-renewed", handleFreeWindowRenewed);
      voiceSocket.off("chat:reconnected", handleReconnected);
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
    minutesUntilPaid,
    minBalanceRequired,
    dismissRechargeBanner,

    // Session end
    sessionEndedLowBalance,

    // Free window renewed
    freeWindowRenewed,

    // Pre-chat check
    canStartChat,
    cantStartReason,
    checkUsage,

    // Reset
    resetFreeMinutesState,
  };
}
