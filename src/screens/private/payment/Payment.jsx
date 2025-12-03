import { useState, useEffect } from "react";
import styles from "./Payment.module.scss";
import { Toast } from "../../../component";
import { Link, useNavigate } from "react-router-dom";
import { useGetAllPlansQuery } from "../../../redux/api/plansApi/plansApi";
import { getToken } from "../../../utils/token";

// Reusable Recharge Pack Component
const RechargePack = ({ actualPrice, discountedPrice, Active }) => (
  <div className={styles.rechargeAmountWrapper}>
    <div className={`${styles.rechargeAmount} ${Active ? styles.active : ""}`}>
      ₹ {actualPrice}
      <span>₹ {discountedPrice} Extra</span>
    </div>
  </div>
);

const Payment = () => {
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token]);
  const [walletBalance, setWalletBalance] = useState(0);

  const { data } = useGetAllPlansQuery();
  const allPlans = data?.data.filter((plan) =>
    Object.keys(plan).includes("plan_id")
  );

  // Load wallet balance from localStorage on mount
  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  return (
    <div className={styles.rechargeTop}>
      <div className={styles.leftSide}>
        <div className={styles.rechargeLeftPack}>
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
                to="/callingpack/payment"
                state={{
                  planId: pack.plan_id,
                }}
                key={pack._id}
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
