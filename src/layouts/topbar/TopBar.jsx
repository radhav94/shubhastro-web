import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TopBar.module.scss";

// Assuming your logo path is correct
import { AppIcons } from "../../utils/appImages";
import SideBar from "../sidebar/SideBar";
import { PATH } from "../../utils/routes/Paths";
// Components and Hooks

// Icons
import { FiMenu } from "react-icons/fi";
import { PrimaryText } from "../../component";
import { IoWalletOutline } from "react-icons/io5";

  const  BOTTOM_MENU = [
    {
      title: "Best Astrologers",
      children: [
        { title: "Vedic Astrologers", path: "/astro/vedic" },
        { title: "Tarot Experts", path: "/astro/tarot" },
      ],
    },
    { title: "Chat with Astrologer", path: "/talk-to-astrologers" },
    { title: "Talk to Astrologer", path: "/talk-to-astrologers" },
    { title: "Astromall", path: "/mall" },
    { title: "Astrotalk Store", path: "/store" },
    {
      title: "Blogs",
      path : "/blog",
    },
  ];


const TopBar = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [currentLang, setCurrentLang] = useState(localStorage.getItem("selectedLanguage") || "en");

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

  function handleLanguageChange(lang) {
    const select = document.querySelector(".goog-te-combo");

    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      setCurrentLang(lang);   // UPDATE UI LANGUAGE
      localStorage.setItem("selectedLanguage", lang);
    } else {
      console.error("Google Translate dropdown not found");
    }
  }

    const  MENU_LIST = [
    { title: "Home", path: PATH.privateRoutes.HOME.path },
    {
      title: "Panchang",
      path: PATH.privateRoutes.PANCHANG.path,
      children: [
        {
          title: "Today's Panchang",
          path: PATH.privateRoutes.PANCHANG_TODAY.path,
        },
      ],
    },
    { title: "Kundli", path: PATH.privateRoutes.KUNDLI.path },
    { title: "Sadesati", path: PATH.privateRoutes.SADESATI.path },
    { title: "Match Making", path: PATH.privateRoutes.MATCHMAKING.path },
    {
      title: "Horoscope",
      children: [
        { title: "Daily Horoscope", path: "/horoscopes/daily-horoscope" },
        {
          title: "Monthly Horoscope",
          path: PATH.privateRoutes.HOROSCOPE.MONTHLY.path,
        },
      ],
    },
    {
      title: "Tarot",
      path: PATH.privateRoutes.TAROT.path,
      children: [
        {
          title: "Shuffle Tarot",
          path: PATH.privateRoutes.TAROT.path,
        },
        {
          title: "Yes/No Tarot",
          path: PATH.privateRoutes.YES_NO_TAROT.path,
        },
        {
          title: "Daily Tarot",
          path: PATH.privateRoutes.DAILY_TAROT.path,
        },
      ],
    },
    {
      title:  <span className="notranslate">{currentLang === "en" ? "Eng" : "हिंदी"}</span>,
      children: [
        currentLang === "en"
          ? {
              title: "हिंदी",
              onClick: () => handleLanguageChange("hi")
            }
          : {
              title: "English",
              onClick: () => handleLanguageChange("en")
            }
      ]
    }
  ];

const BOTTOM_MENU = [
  {
    title: "Best Astrologers",
    children: [
      { title: "Vedic Astrologers", path: "/astro/vedic" },
      { title: "Tarot Experts", path: "/astro/tarot" },
    ],
  },
  { title: "Chat with Astrologer", path: "/talk-to-astrologers" },
  { title: "Talk to Astrologer", path: "/talk-to-astrologers" },
  { title: "Astromall", path: "/shop" },
  // { title: "Shubhtalk Store", path: "/store" },
  {
    title: "Blogs",
    path: "/blog",
  },
];


  useEffect(() => {
    const updateWalletFromStorage = () => {
      const storedWallet = JSON.parse(localStorage.getItem("wallet")) || {
        amount: 0,
      };
      setWalletBalance(Number(storedWallet.amount));
    };

    // run once on mount
    updateWalletFromStorage();

    // listen for custom wallet updates
    const handleWalletUpdated = (event) => {
      // you can either use event.detail.amount or read from localStorage again
      if (event?.detail?.amount != null) {
        setWalletBalance(Number(event.detail.amount));
      } else {
        updateWalletFromStorage();
      }
    };
    //Translate if hindi lang is selected
    const savedLang = localStorage.getItem("selectedLanguage");

    if (!savedLang || savedLang === "en") return; 

    const interval = setInterval(() => {
      const select = document.querySelector(".goog-te-combo");
      if (select) {
        select.value = savedLang;
        select.dispatchEvent(new Event("change"));
        clearInterval(interval);
      }
    }, 500);

    window.addEventListener("wallet-updated", handleWalletUpdated);

    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdated);
      clearInterval(interval);
    };
  }, []); // 🔹 IMPORTANT: empty dependency array

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
            {/* {token && (
              <button
                className={`${styles.walletButton} ${styles.hideOnMobile}`}
                onClick={() => navigate(PATH.privateRoutes.RECHARGE.path)}
              >
                <IoWalletOutline />
                <span>₹{walletBalance.toFixed(2)}</span>
              </button>
            )} */}

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

            <header className={styles.navbar}>
              <nav className={styles.navbarMenu}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <ul>
                    {MENU_LIST.map((item, index) => (
                      <NavbarItem key={index} {...item} />
                    ))}

                    <li>
                      {/* Sign In CTA Button */}
                      {!token ? (
                        <button
                          className={`${styles.ctaButton} ${styles.hideOnMobile}`}
                          onClick={() => navigate("/login")}
                        >
                          LogIn
                        </button>
                      ) : (
                        <button
                          className={`${styles.ctaButton} ${styles.hideOnMobile}`}
                          onClick={handleLogout}
                        >
                          Log out
                        </button>
                      )}
                    </li>
                  </ul>
                </div>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <ul>
                    {BOTTOM_MENU.map((item, index) => (
                      <NavbarItem key={index} {...item} />
                    ))}
                  </ul>
                </div>
              </nav>
            </header>
          </div>
        </div>
      </header>
    </>
  );
};

export default TopBar;

const NavbarItem = ({ title, path, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = path && location.pathname === path;

  return (
    <li
      className={`${children ? styles.dropdown : ""} ${
        isActive ? styles.active : ""
      }`}
      onClick={!children ? () => navigate(path) : undefined}
    >
      {/* FIXED ALIGNMENT WRAPPER */}
      <div className={styles.navItemLabel}>
        <PrimaryText size_14>{title}</PrimaryText>
        {children && <span className={styles.arrow}></span>}
      </div>

      {children && (
        <div className={styles.dropdownWrapper}>
          <ul className={styles.dropdownMenu}>
            {children.map((child, idx) => (
              <li key={idx} onClick={() => child?.onClick ? child?.onClick() : navigate(child.path)}>
              
                {child.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};
