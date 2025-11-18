import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { PrimaryText } from "../../component";

const TopBar = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  // const isLoggedIn = JSON.parse(localStorage.getItem("isLoggedIn"));
  const token = localStorage.getItem("verifyOtpToken");
  const handleLogout = () => {
    localStorage.removeItem("verifyOtpToken");
    navigate("/");
    // localStorage.setItem("isLoggedIn", JSON.stringify(false));
  };

  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`${styles.topBar} ${scrolled ? styles.scrolled : ""}`}>
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
            <button className={styles.iconButton} aria-label="Notifications">
              {/* <Link to="/">
                <IoHomeOutline />
              </Link> */}
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

      {/* Sidebar for mobile */}
      {isMobile && (
        <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default TopBar;
