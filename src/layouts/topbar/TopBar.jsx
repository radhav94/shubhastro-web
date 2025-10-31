import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TopBar.module.scss";

// Assuming your logo path is correct
import { AppIcons, AppImages } from "../../utils/appImages";

// Components and Hooks
import SideBar from "../sidebar/SideBar";
import { useIsMobile } from "../../utils/hooks/useIsMobile";
import { PATH } from "../../utils/routes/Paths";

// Icons
import { IoHomeOutline, IoWalletOutline } from "react-icons/io5";
import { MdGTranslate } from "react-icons/md";
import { FiMenu } from "react-icons/fi";

const TopBar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const isLoggedIn = JSON.parse(localStorage.getItem("isLoggedIn"));

  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  return (
    <>
      <header className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.leftSection}>
            {isMobile && (
              <FiMenu
                className={styles.menuIcon}
                onClick={() => setSidebarOpen(true)}
              />
            )}
            <div className={styles.logoContainer} onClick={() => navigate("/")}>
              <img src={AppIcons.Logo} alt="Shubh Talk Logo" />
            </div>
          </div>

          <div className={styles.rightSection}>
            {/* Wallet Button */}
            <button
              className={`${styles.walletButton} ${styles.hideOnMobile}`}
              onClick={() => navigate(PATH.privateRoutes.RECHARGE.path)}
            >
              <IoWalletOutline />
              <span>₹{walletBalance.toFixed(2)}</span>
            </button>

            {/* Language & Notifications Icon Buttons */}
            <button
              className={`${styles.iconButton} ${styles.hideOnMobile}`}
              aria-label="Translate"
            >
              <MdGTranslate />
            </button>
            <button className={styles.iconButton} aria-label="Notifications">
              <IoHomeOutline />
            </button>

            {/* Sign In CTA Button */}
            {!isLoggedIn && <button
              className={`${styles.ctaButton} ${styles.hideOnMobile}`}
              onClick={() => navigate("/login") }
            >
              Sign In
            </button>}
          </div>
        </div>
      </header>

      {/* Sidebar for mobile */}
      {isMobile && (
        <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
