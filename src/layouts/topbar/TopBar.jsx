import React, { useEffect, useState } from "react";
import { AppIcons } from "../../utils/appImages";
import { appColors } from "../../utils/theme";
import PrimaryButton from "../../component/PrimaryButton";
import { IoIosNotifications } from "react-icons/io";
import { MdGTranslate } from "react-icons/md";
import { FiMenu } from "react-icons/fi";
import styles from "./TopBar.module.scss";

import SideBar from "../sidebar/SideBar";
import { useIsMobile } from "../../utils/hooks/useIsMobile";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../utils/routes/Paths";

const TopBar = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
      amount: 0,
    };
    setWalletBalance(Number(storedWallet.amount));
  }, []);

  const navigate = useNavigate();
  return (
    <>
      <div className={styles.topBar}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          {isMobile && (
            <FiMenu
              className={styles.menuIcon}
              onClick={() => setSidebarOpen(true)}
            />
          )}

          <div className={styles.logoContainer} onClick={() => navigate("/")}>
            <img alt="logo" src={AppIcons.Logo} />
          </div>
        </div>

        <div className={styles.rightSection}>
          <PrimaryButton
            title={`Rs. ${walletBalance.toFixed(2)}`}
            bgColor={appColors.greyLight}
            onClick={() => navigate(PATH.privateRoutes.RECHARGE.path)}
          />
          <PrimaryButton
            IconComponent={MdGTranslate}
            bgColor={appColors.greyLight}
            title="Eng"
          />
          <PrimaryButton
            IconComponent={IoIosNotifications}
            bgColor={appColors.greyLight}
            onClick={() => navigate("/counsaltant")}
          />

          <PrimaryButton title="Sign In" onClick={() => navigate("/login")} />
        </div>
      </div>

      {/* Sidebar for mobile */}
      {isMobile && sidebarOpen && (
        <SideBar
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
        ></SideBar>
      )}
    </>
  );
};

export default TopBar;
