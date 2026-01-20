// useWalletBalance.js
import { useEffect, useState, useCallback } from "react";
import { useLazyGetWalletBalanceQuery } from "../../../redux/api/wallet/walletApi";

const LOCAL_KEY = "astro_wallet_balance";

export const useWalletBalance = () => {
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? Number(stored) : null; 
  });

  // Lazy query: API will NOT run automatically
  const [trigger, { data, isFetching }] =
    useLazyGetWalletBalanceQuery();

  // Call API ONLY on first load if no local data
  useEffect(() => {
    if (balance === null) {
      trigger(); // first-time load only
    }
  }, [balance, trigger]);

  // Sync API → localStorage + state
  useEffect(() => {
    if (data?.data !== undefined && !isNaN(data?.data)) {
      const newBalance = Number(data.data);
      localStorage.setItem(LOCAL_KEY, newBalance);
      setBalance(newBalance);
    }
  }, [data]);

  // Manually refresh wallet from API
  const refreshWallet = useCallback(() => {
    trigger();
  }, [trigger]);

  return {
    balance,
    isFetching,
    refreshWallet,
  };
};
