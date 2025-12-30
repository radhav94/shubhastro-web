import { useState, useEffect } from "react";
import styles from "./Payment.module.scss";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllPlansQuery } from "../../../redux/api/plansApi/plansApi";
import { getToken } from "../../../utils/token";

const RechargePack = ({ actualPrice, discountedPrice, Active }) => (
  <div className={styles.rechargeAmountWrapper}>
    <div className={`${styles.rechargeAmount} ${Active ? styles.active : ""}`}>
      <div className={styles.price}>₹ {actualPrice}</div>
      <span className={styles.extra}>+ ₹ {discountedPrice} Extra</span>
    </div>
  </div>
);

const Payment = () => {
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token]);

  const [walletBalance, setWalletBalance] = useState(0);

  const { data } = useGetAllPlansQuery();
  const allPlans = data?.data.filter((plan) =>
    Object.keys(plan).includes("plan_id")
  );

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("wallet")) || { amount: 0 };
    setWalletBalance(Number(stored.amount));
  }, []);

  return (
    <div className={styles.rechargeTop}>
      <div className={styles.leftSide}>
        <div className={styles.walletBalance}>
          <img
            src="https://images.astroyogi.com/astroyogi/wallet_blc.png"
            alt="Wallet"
            width={51}
            height={50}
          />
          Wallet Balance
          <span className={styles.dangerColor}>
            ₹ {walletBalance.toFixed(2)}
          </span>
        </div>

        <div className={styles.rechargeHeader}>Add Money to Wallet</div>

        <div className={styles.rechargeFlex}>
          {allPlans?.map((pack) => (
            <Link
              to="/recharge/payment"
              state={{ planId: pack.plan_id }}
              key={pack._id}
              className={styles.linkWrapper}
            >
              <RechargePack {...pack} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Payment;
