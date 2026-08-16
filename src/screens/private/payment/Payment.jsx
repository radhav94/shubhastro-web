import { useEffect, useState } from "react";
import styles from "./Payment.module.scss";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useGetAllPlansQuery } from "../../../redux/api/plansApi/plansApi";
import { getToken } from "../../../utils/token";
import { useWalletBalance } from "../wallet/useWalletBalance";
import { trackEvent } from "../../../utils/analytics";

/*
 * `Active` drives the `.active` box-shadow in Payment.module.scss, but no caller
 * ever passed it: the only usage is `<RechargePack {...pack} />` spreading a
 * plan object from useGetAllPlansQuery, and the plans API has no `Active` field.
 * So the selected state was dead CSS and a tap produced no visual change at all.
 *
 * That matters because /recharge/payment is a lazy route (see Paths.js), so
 * tapping an amount fires a chunk fetch and *then* navigates. With no pressed
 * state and no spinner, the gap between tap and navigation looked like nothing
 * happening — which is what Clarity logged as a dead click on the ₹20 option.
 */
const RechargePack = ({ actualPrice, discountedPrice, Active }) => (
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = getToken();
  
  // Get return URL from query params
  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Use the wallet balance hook
  const { balance, isFetching, refreshWallet } = useWalletBalance();

  const { data, isLoading: isPlansLoading, isError: isPlansError, refetch: refetchPlans } =
    useGetAllPlansQuery();
  const allPlans = data?.data ?? [];

  // Which amount the user just tapped. Gives the card an immediate pressed state
  // while the lazy /recharge/payment chunk loads, so the tap is acknowledged.
  const [pendingPlanId, setPendingPlanId] = useState(null);

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
            {/* location.key, not window.history.length — see BackButton.jsx */}
            <button className={styles.localBackBtn} onClick={() => {
              if (location.key !== "default") navigate(-1);
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

        {/*
          The grid previously rendered nothing at all while the plans request was
          in flight and nothing when it failed or came back empty — so the page
          showed the "Add Money to Wallet" heading above blank space, and a tap
          where the amounts were about to appear went nowhere. Both states are
          explicit now, and the error state offers a retry instead of dead-ending.
        */}
        {isPlansLoading ? (
          <div className={styles.plansStatus} role="status">Loading amounts…</div>
        ) : isPlansError ? (
          <div className={styles.plansStatus} role="alert">
            Couldn&apos;t load the recharge amounts.{" "}
            <button type="button" className={styles.plansRetry} onClick={refetchPlans}>
              Try again
            </button>
          </div>
        ) : allPlans.length === 0 ? (
          <div className={styles.plansStatus} role="status">
            No recharge amounts are available right now. Please try again shortly.
          </div>
        ) : (
          <div className={styles.rechargeFlex}>
            {allPlans?.map((pack) => (
              <Link
                to="/recharge/payment"
                state={{ planId: pack?._id, returnUrl }}
                key={pack._id}
                className={styles.linkWrapper}
                aria-busy={pendingPlanId === pack._id}
                onClick={() => {
                  // Paint the pressed state before the lazy route chunk starts
                  // loading, so the tap is visibly acknowledged either way.
                  setPendingPlanId(pack._id);
                  trackEvent("recharge_amount_selected", { amount: pack?.actualPrice, is_preset: true });
                }}
              >
                <RechargePack {...pack} Active={pendingPlanId === pack._id} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Payment;
