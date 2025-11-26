import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TopBar.module.scss";

// Assuming your logo path is correct
import { AppIcons } from "../../utils/appImages";
import SideBar from "../sidebar/SideBar";

// Components and Hooks

// Icons
import { FiMenu } from "react-icons/fi";
import { PrimaryText } from "../../component";

const TopBar = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  // const token = localStorage.getItem("verifyOtpToken");
  // const handleLogout = () => {
  //   localStorage.removeItem("verifyOtpToken");
  //   navigate("/");
  // };

  const role = localStorage.getItem("shubhtalk_role");
const token =
  role === "ASTROLOGER"
    ? localStorage.getItem("shubhtalk_astro_token")
    : localStorage.getItem("shubhtalk_customer_token");


  const handleLogout = () => {
  const role = localStorage.getItem("shubhtalk_role");

  if (role === "ASTROLOGER") {
    localStorage.removeItem("shubhtalk_astro_token");
    localStorage.removeItem("shubhtalk_astro_id");
  }

  if (role === "CUSTOMER") {
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_customer_id");
    localStorage.removeItem("shubhtalk_customer_wallet");
  }
  localStorage.removeItem("shubhtalk_role");
  navigate("/");
};

  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  return (
    <>
      {/* SIDEBAR */}
      <SideBar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header className={`${styles.topBar}`}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            {/* HAMBURGER MENU → opens sidebar */}

            <div className={styles.logoContainer} onClick={() => navigate("/")}>
              <img src={AppIcons.Logo} alt="Shubh Talk Logo" />
              <PrimaryText marginLeft="5px" isBold size_28>
                Shubhtalk
              </PrimaryText>
            </div>
          </div>

          <div className={styles.rightSection}>
            {/* Wallet Button  */}
            {/* <button
              className={`${styles.walletButton} ${styles.hideOnMobile}`}
              onClick={() => navigate(PATH.privateRoutes.RECHARGE.path)}
            >
              <IoWalletOutline />
              <span>₹{walletBalance.toFixed(2)}</span>
            </button> */}

            {/* Language & Notifications Buttons */}
            {/* <button
              className={`${styles.iconButton} ${styles.hideOnMobile}`}
              aria-label="Translate"
            >
              <MdGTranslate />
            </button> */}
            <button
              className={styles.menuIcon}
              onClick={() => setSidebarOpen(true)}
              aria-label="Hamburger Menu"
            >
              <FiMenu />
            </button>

            {/* Sign In CTA Button */}
            {!token ? (
              <button
                className={`${styles.ctaButton} ${styles.hideOnMobile}`}
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
            ) : (
              <button
                className={`${styles.ctaButton} ${styles.hideOnMobile}`}
                onClick={handleLogout}
              >
                Log out
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default TopBar;
