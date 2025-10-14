import React, { useState } from "react";
import styles from "./SideBar.module.scss";
import PrimaryText from "../../component/PrimaryText";
import Divider from "../../component/Divider";
import { appShadow } from "../../utils/theme";
import PrimaryButton from "../../component/PrimaryButton";
import { IoClose } from "react-icons/io5";

const SideBar = ({ onClose, isOpen }) => {
  const menuItems = [
    { title: "Home" },
    { title: "Consult Now" },
    { title: "Horoscope" },
    {
      title: "Year 2025",
      children: ["2025 Overview", "Love Horoscope", "Career Horoscope"],
    },
    { title: "Panchang" },
    { title: "Kundli" },
    { title: "Numerology" },
    { title: "Tarot" },
    { title: "Free Readings" },
    { title: "Yogi Live", tag: "Watch", tagType: "watch" },
    { title: "Video" },
    { title: "Blog" },
    { title: "Session Booking" },
    { title: "Yogii Mall", tag: "New", tagType: "new" },
  ];

  const [openMenus, setOpenMenus] = useState({});

  const toggleSubMenu = (index) => {
    setOpenMenus((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
      <div>
        <div style={{ boxShadow: appShadow[4] }} className={styles.header}>
          <PrimaryText size_14>Shubh Talk</PrimaryText>
          <PrimaryButton
            transparent
            IconComponent={IoClose}
            onClick={onClose}
          />
        </div>
        <div className={styles.sidebarContent}>
          <ul>
            {menuItems.map((item, idx) => (
              <div>
                <li key={idx}>
                  <PrimaryText
                    size_14
                    onClick={() => item.children && toggleSubMenu(idx)}
                    style={{ cursor: item.children ? "pointer" : "default" }}
                  >
                    {item.title} {item.children && <span>&#9662;</span>}
                  </PrimaryText>

                  {item.children && openMenus[idx] && (
                    <ul className={styles.subMenu}>
                      {item.children.map((sub, subIdx) => (
                        <li key={subIdx}>{sub}</li>
                      ))}
                    </ul>
                  )}
                </li>
                <Divider responsive={true} />
              </div>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
