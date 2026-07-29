import { useEffect } from "react";
import styles from "./Payment.module.scss";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllPlansQuery } from "../../../redux/api/plansApi/plansApi";
import { getToken } from "../../../utils/token";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { trackEvent } from "../../../utils/analytics";

const RechargePack = ({ name, actualPrice, discountedPrice, offerPrice, Active }) => (
  <div className={styles.rechargeAmountWrapper}>
    <div className={`${styles.rechargeAmount} ${Active ? styles.active : ""}`}>
      <div className={styles.price}>₹ {actualPrice}</div>
      {discountedPrice > 0 && (
        <span className={styles.extra}>Bonus ₹ {discountedPrice}</span>
      )}
    </div>
  </div>
);

const Payment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = getToken();
  
  // Get return URL from query params
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Use the wallet balance hook
  const { balance, isFetching, refreshWallet } = useWalletBalance();

  const { data } = useGetAllPlansQuery();
  const allPlans = data?.data ?? [];

  // Refresh wallet balance when component mounts
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  // Track recharge flow start (once on mount)
  useEffect(() => {
    trackEvent("recharge_initiated", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.rechargeWrapper}>
      <div className={styles.rechargeTop}>
        <div className={styles.leftSide}>
          <div className={styles.walletBalance}>
            <button className={styles.localBackBtn} onClick={() => {
              if (window.history.length > 1) navigate(-1);
                else navigate("/", { replace: true });
              }} aria-label="Go back">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            <div className={styles.titleWallet}>
              <img
                src="https://images.astroyogi.com/astroyogi/wallet_blc.png"
                alt="Wallet"
                width={45}
                height={45}
              />
              Wallet Balance
              <span className={styles.dangerColor}>
                {isFetching ? "..." : balance !== null ? `₹ ${Math.round(balance)}` : "₹ 0"}
              </span>
            </div>

        </div>

        <div className={styles.rechargeHeader}>Add Money to Wallet</div>

        <div className={styles.rechargeFlex}>
          {allPlans?.map((pack) => (
            <Link
              to="/recharge/payment"
              state={{ planId: pack?._id, returnUrl }}
              key={pack._id}
              className={styles.linkWrapper}
              onClick={() => trackEvent("recharge_amount_selected", { amount: pack?.actualPrice, is_preset: true })}
            >
              <RechargePack {...pack} />
            </Link>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};

export default Payment;
