// useWalletBalance.js
import { useEffect, useState, useCallback } from "react";
import { useLazyGetWalletBalanceQuery } from "../../../redux/api/wallet/walletApi";
import { getToken } from "../../../utils/token";

const LOCAL_KEY = "astro_wallet_balance";

export const useWalletBalance = () => {
  const [balance, setBalance] = useState(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? Number(stored) : null;
  });

  const [trigger, { data, isFetching }] = useLazyGetWalletBalanceQuery();

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
    }
  }, [data]);

  const refreshWallet = useCallback(() => {
    if (!getToken()) return;
    trigger();
  }, [trigger]);

  return {
    balance,
    isFetching,
    refreshWallet,
  };
};
