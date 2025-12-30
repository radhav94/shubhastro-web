import React, { useState } from "react";
import styles from "./SideBar.module.scss";
import { useNavigate } from "react-router-dom";
import { FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { PrimaryText } from "../../component";
import { PATH } from "../../utils/routes/Paths";
import { getUserFromStorage } from "../../utils/authStorage";

const SideBar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null); // for accordion
  const user = getUserFromStorage();

  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const [currentLang, setCurrentLang] = useState(
    localStorage.getItem("selectedLanguage") || "en"
  );

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
    onClose();
  };

  function handleLanguageChange(lang) {
    const select = document.querySelector(".goog-te-combo");

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      setCurrentLang(lang);
      localStorage.setItem("selectedLanguage", lang);
    } else {
      console.error("Google Translate dropdown not found");
    }
    onClose();
  }

  const MENU_LIST = [
    { title: "Home", path: PATH.privateRoutes.HOME.path },
    {
      title: "Panchang",
      path: PATH.privateRoutes.PANCHANG.path,
    },
    { title: "Free Kundli", path: PATH.privateRoutes.KUNDLI.path },
    // { title: "Sadesati", path: PATH.privateRoutes.SADESATI.path },
    { title: "Match Making", path: PATH.privateRoutes.MATCHMAKING.path },
    {
      title: "Horoscope",
      children: [
        { title: "Today's Horoscope", path: "/horoscopes/todays-horoscope" },
        { title: "Daily Horoscope", path: "/horoscopes/daily-horoscope" },
        { title: "Yearly Horoscope", path: "/horoscopes/yearly-horoscope" },
        { title: "Weekly Horoscope", path: "/horoscopes/weekly-horoscope" },
      ],
    },
    { title: "Compatibility", path: PATH.privateRoutes.COMPATIBILITY.path },
    {
      title: "Tarot",
      path: PATH.privateRoutes.TAROT.path,
      children: [
        {
          title: "Yes/No Tarot",
          path: PATH.privateRoutes.YES_NO_TAROT.path,
        },
        {
          title: "Career Select",
          path: PATH.privateRoutes.CAREER_SELECT_TAROT.path,
        },
        {
          title: "Love Triangle",
          path: PATH.privateRoutes.LOVE_TRIANGLE_TAROT.path,
        },
        {
          title: "Daily",
          path: PATH.privateRoutes.DAILY_TAROT.path,
        },
        {
          title: "In Depth Love",
          path: PATH.privateRoutes.IN_DEPTH_TAROT.path,
        },
        {
          title: "Erotic Love",
          path: PATH.privateRoutes.EROTIC_LOVE_TAROT.path,
        },
        {
          title: "Made For Each Other",
          path: PATH.privateRoutes.MADE_FOR_EACH_OTHER_TAROT.path,
        },
        {
          title: "Flirt Reading",
          path: PATH.privateRoutes.FLIRT_TAROT.path,
        },
        {
          title: "Romantic Breakup",
          path: PATH.privateRoutes.ROMANTIC_BREAKUP_TAROT.path,
        },
        {
          title: "Business Breakup",
          path: PATH.privateRoutes.BUISNESS_BREAKUP_TAROT.path,
        },
      ],
    },
    {
      title: (
        <span className="notranslate">
          {currentLang === "en" ? "English" : "हिंदी"}
        </span>
      ),
      children: [
        currentLang === "en"
          ? {
              title: "हिंदी",
              onClick: () => handleLanguageChange("hi"),
            }
          : {
              title: "English",
              onClick: () => handleLanguageChange("en"),
            },
      ],
    },
  ];

  const BOTTOM_MENU = [
    { title: "Chat with Astrologer", path: "/talk-to-astrologers" },
    { title: "Talk to Astrologer", path: "/talk-to-astrologers" },
    { title: "Join Live", path: "/audience-live-streaming" },
    { title: "Astromall", path: "/shop" },
    { title: "Blogs", path: "/blog" },
    { title: "Recharge", path: "/recharge" },
  ];

  const USER_MENU_ITEMS = token
    ? [
        {
          title: "Profile",
          path: "/profile",
        },
        {
          title: "Notification",
          path: "/notification",
        },
        {
          title: "Wallet Transactions",
          path: "/wallet-transactions",
        },
        {
          title: "Order History",
          path: "/order-history",
        },
        {
          title: "Logout",
          onClick: handleLogout,
        },
      ]
    : [
        {
          title: "Login",
          path: "/login",
        },
      ];

  const handleClick = (path, onClick) => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
    onClose();
  };

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const renderMenuItem = (item, index, isBottomMenu = false) => {
    if (!item.children) {
      return (
        <li key={index} className={styles.menuItem}>
          <span
            className={`${styles.menuLink} ${
              isBottomMenu ? styles.bottomMenu : ""
            }`}
            onClick={() => handleClick(item.path, item.onClick)}
          >
            {typeof item.title === "string" ? item.title : item.title}
          </span>
        </li>
      );
    }

    return (
      <li key={index} className={styles.menuItem}>
        <div
          className={`${styles.parentRow} ${
            isBottomMenu ? styles.bottomMenu : ""
          }`}
          onClick={() => toggleDropdown(index)}
        >
          <span>{typeof item.title === "string" ? item.title : item.title}</span>
          {openIndex === index ? (
            <FiChevronUp className={styles.chevron} />
          ) : (
            <FiChevronDown className={styles.chevron} />
          )}
        </div>

        {/* Accordion Submenu */}
        <ul
          className={`${styles.submenu} ${
            openIndex === index ? styles.submenuOpen : ""
          }`}
        >
          {item.children.map((child, idx) => (
            <li
              key={idx}
              className={styles.submenuItem}
              onClick={() => handleClick(child.path, child.onClick)}
            >
              {typeof child.title === "string"
                ? child.title
                : renderUserProfile(child.title)}
            </li>
          ))}
        </ul>
      </li>
    );
  };

  const renderUserProfile = (content) => {
    if (content && content.props && content.props.className?.includes("userInfo")) {
      return (
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            <img
              src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="user"
              className={styles.avatar}
            />
          </div>
          <div className={styles.userDetails}>
            <PrimaryText size_14 isBold isCenter>
              {user?.firstName || "User"}
            </PrimaryText>
            <PrimaryText size_12 isBold color="#466590" isCenter={true}>
              {user?.phoneNumber || ""}
            </PrimaryText>
          </div>
        </div>
      );
    }
    return content;
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.show : ""}`}
        onClick={onClose}
      ></div>

      <div className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.header}>
          <FiX className={styles.closeIcon} onClick={onClose} />
          <span className={styles.title}>Menu</span>
        </div>

        {/* User Profile Section for Mobile */}
        {token && (
          <div className={styles.userProfileSection}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <img
                  src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                  alt="user"
                  className={styles.avatar}
                />
              </div>
              <div className={styles.userDetails}>
                <PrimaryText size_14 isBold>
                  {user?.firstName || "User"}
                </PrimaryText>
                <PrimaryText size_12 color="#466590">
                  {user?.phoneNumber || ""}
                </PrimaryText>
              </div>
            </div>
          </div>
        )}

        <div className={styles.menuContainer}>
          {/* Main Menu Items */}
          <ul className={styles.menuList}>
            {MENU_LIST.map((item, index) => renderMenuItem(item, index))}
          </ul>

          {/* Divider */}
          {/* <div className={styles.divider}></div> */}

          {/* Bottom Menu Items */}
          <ul className={styles.menuList}>
            {BOTTOM_MENU.map((item, index) => renderMenuItem(item, index, true))}
          </ul>

          {/* Divider */}
          {/* <div className={styles.divider}></div> */}

          {/* User Menu Items */}
          <ul className={styles.menuList}>
            {USER_MENU_ITEMS.map((item, index) => (
              <li key={index} className={styles.menuItem}>
                <span
                  className={styles.menuLink}
                  onClick={() => handleClick(item.path, item.onClick)}
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default SideBar;