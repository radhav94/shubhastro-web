import { useEffect, useState, useCallback, useRef } from "react";
import { useLazyGetWalletBalanceQuery } from "../../../redux/api/wallet/walletApi";
import { getToken } from "../../../utils/token";

const LOCAL_KEY = "astro_wallet_balance";

export const useWalletBalance = () => {
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? Number(stored) : null;
  });

  const [trigger, { data, isFetching }] = useLazyGetWalletBalanceQuery();
  const fetchCount = useRef(0);
  const isSelfUpdate = useRef(false);

  useEffect(() => {
    if (!getToken()) return;
    if (balance === null) {
      trigger();
    }
  }, [balance, trigger]);

  useEffect(() => {
    if (data?.data !== undefined && !isNaN(data?.data)) {
      const newBalance = Number(data.data);
      localStorage.setItem(LOCAL_KEY, newBalance);
      setBalance(newBalance);
      // Notify other hook instances in the same tab
      isSelfUpdate.current = true;
      window.dispatchEvent(
        new CustomEvent("walletBalanceSynced", { detail: { balance: newBalance } })
      );
    }
  }, [data, fetchCount.current]);

  const refreshWallet = useCallback(() => {
    if (!getToken()) return;
    fetchCount.current += 1;
    // Force cache bust by passing unique arg
    trigger(fetchCount.current, false);
  }, [trigger]);

  // Listen for wallet balance updated via API refresh (e.g. recharge, call end)
  useEffect(() => {
    const handleWalletUpdate = () => {
      if (getToken()) {
        fetchCount.current += 1;
        trigger(fetchCount.current, false);
      }
    };
    window.addEventListener("walletBalanceUpdated", handleWalletUpdate);
    return () => window.removeEventListener("walletBalanceUpdated", handleWalletUpdate);
  }, [trigger]);

  // Listen for real-time balance from socket activity events (no API call needed)
  useEffect(() => {
    const handleSocketBalance = (e) => {
      const newBalance = e.detail?.balance;
      if (newBalance !== undefined && !isNaN(newBalance)) {
        localStorage.setItem(LOCAL_KEY, String(newBalance));
        setBalance(Number(newBalance));
        // Notify other hook instances in the same tab
        isSelfUpdate.current = true;
        window.dispatchEvent(
          new CustomEvent("walletBalanceSynced", { detail: { balance: Number(newBalance) } })
        );
      }
    };
    window.addEventListener("walletBalanceFromSocket", handleSocketBalance);
    return () => window.removeEventListener("walletBalanceFromSocket", handleSocketBalance);
  }, []);

  // Sync balance across multiple hook instances within the same tab
  useEffect(() => {
    const handleBalanceSync = (e) => {
      if (isSelfUpdate.current) {
        isSelfUpdate.current = false;
        return;
      }
      const newBalance = e.detail?.balance;
      if (newBalance !== undefined && !isNaN(newBalance)) {
        setBalance(Number(newBalance));
      }
    };
    window.addEventListener("walletBalanceSynced", handleBalanceSync);
    return () => window.removeEventListener("walletBalanceSynced", handleBalanceSync);
  }, []);

  // Sync balance across browser tabs via storage event
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === LOCAL_KEY && e.newValue !== null) {
        setBalance(Number(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    balance,
    isFetching,
    refreshWallet,
  };
};
