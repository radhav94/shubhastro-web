import { useEffect } from "react";
import styles from "./Payment.module.scss";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useGetAllPlansQuery } from "../../../redux/api/plansApi/plansApi";
import { getToken } from "../../../utils/token";
import { useWalletBalance } from "../wallet/useWalletBalance";
import BackButton from "../../../component/UI/BackButton/BackButton";

const RechargePack = ({ name, actualPrice, discountedPrice, offerPrice, Active }) => (
  <div className={styles.rechargeAmountWrapper}>
    <div className={`${styles.rechargeAmount} ${Active ? styles.active : ""}`}>
      {name && <div className={styles.planName}>{name}</div>}
      {offerPrice > actualPrice && (
        <span className={styles.strikePrice}>₹ {offerPrice}</span>
      )}
      <div className={styles.price}>₹ {actualPrice}</div>
      {discountedPrice > 0 && (
        <span className={styles.extra}>Save ₹ {discountedPrice}</span>
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
  const allPlans = data?.data?.filter((plan) => plan?.device === 'web' || !plan?.device) ?? [];

  // Refresh wallet balance when component mounts
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return (
    <div className={styles.rechargeWrapper}>
      <BackButton />
      <div className={styles.rechargeTop}>
        <div className={styles.leftSide}>
          <div className={styles.walletBalance}>
          <img
            src="https://images.astroyogi.com/astroyogi/wallet_blc.png"
            alt="Wallet"
            width={45}
            height={45}
          />
          Wallet Balance
          <span className={styles.dangerColor}>
            {isFetching ? "..." : balance !== null ? `₹ ${balance.toFixed(2)}` : "₹ 0.00"}
          </span>
        </div>

        <div className={styles.rechargeHeader}>Add Money to Wallet</div>

        <div className={styles.rechargeFlex}>
          {allPlans?.map((pack) => (
            <Link
              to="/recharge/payment"
              state={{ planId: pack?._id, returnUrl }}
              key={pack._id}
              className={styles.linkWrapper}
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
