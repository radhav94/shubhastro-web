import React from "react";
import styles from "./QuickActionTray.module.scss";
import { useNavigate } from "react-router-dom";
import {
  IoChatbubbleEllipses,
  IoCall,
  IoCart,
  IoFlower,
} from "react-icons/io5";
import { PATH } from "../../../../../utils/routes/Paths";
import { isShubhMallEnabled } from "../../../../../utils/featureConfig";

const QuickActionTray = () => {
  const ALL_ACTIONS = [
    {
      id: "chat",
      label: "Chat with Astrologer",
      icon: <IoChatbubbleEllipses />,
      path: PATH.privateRoutes.Chat_With_ASTROLOGER.path,
      bg: "#ff7eb3",
    },
    {
      id: "talk",
      label: "Talk to Astrologer",
      icon: <IoCall />,
      path: PATH.privateRoutes.TALK_TO_ASTROLOGER.path,
      bg: "#2ed8b6",
    },
    {
      id: "shop",
      label: "ShubhMall Shop",
      icon: <IoCart />,
      path: PATH.privateRoutes.SHOP?.path,
      bg: "#5da9ff",
      isMall: true,
    },
    {
      id: "pooja",
      label: "Book A Pooja",
      icon: <IoFlower />,
      path: "shop/vip-e-pooja",
      bg: "#ff9f6e",
      isMall: true,
    },
  ];

  const ACTIONS = ALL_ACTIONS.filter(
    (item) => !item.isMall || isShubhMallEnabled()
  );

  const navigate = useNavigate();

  return (
    <div className={styles.tray}>
      {ACTIONS.map((item) => (
        <div
          key={item.id}
          className={styles.card}
          onClick={() => navigate(item.path)}
        >
          <div
            className={styles.iconWrapper}
            style={{ backgroundColor: item.bg }}
          >
            {item.icon}
          </div>

          <p className={styles.label}>{item.label}</p>
        </div>
      ))}
    </div>
  );
};

export default QuickActionTray;
