import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TopBar.module.scss";

// Assuming your logo path is correct
import { AppIcons, appSvgs } from "../../utils/appImages";
import SideBar from "../sidebar/SideBar";
import { PATH } from "../../utils/routes/Paths";
import { isShubhMallEnabled } from "../../utils/featureConfig";
// Components and Hooks

// Icons
import { FiMenu } from "react-icons/fi";
import { PrimaryText } from "../../component";
import { getUserFromStorage } from "../../utils/authStorage";
import { useDispatch } from "react-redux";
import { clearFormAndCache } from "../../redux/actions/clearFormAndCache";
import { clearSelectedKundli } from "../../redux/kundli/kundliSlice";

const TopBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUserFromStorage());
  const dispatch = useDispatch();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [currentLang, setCurrentLang] = useState(() => {
    // Get language from cookie instead of localStorage
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("googtrans="));
    if (cookie) {
      const value = decodeURIComponent(cookie.split("=")[1]);
      const parts = value.split("/");
      return parts[2] || "en";
    }
    return "en";
  });

  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

  const handleLogout = () => {
    dispatch(clearFormAndCache());
     dispatch(clearSelectedKundli())
    navigate("/");
  };

  function handleLanguageChange(lang) {
    // Clear Google Translate cookies completely
    const clearCookies = () => {
      const hostname = window.location.hostname;
      const cookiesToClear = ['googtrans', 'googtrans_backup'];
      
      const domainParts = hostname.split('.');
      const domains = [''];
      
      domains.push(`domain=${hostname}`);
      
      if (domainParts.length > 1) {
        domains.push(`domain=.${hostname}`);
        
        if (domainParts.length > 2) {
          const parentDomain = domainParts.slice(-2).join('.');
          domains.push(`domain=.${parentDomain}`);
        }
      }

      cookiesToClear.forEach(cookieName => {
        domains.forEach(domainStr => {
          ['/', ''].forEach(path => {
            const pathStr = path ? `path=${path};` : '';
            const domainPart = domainStr ? `${domainStr};` : '';
            
            document.cookie = `${cookieName}=; ${pathStr} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
            document.cookie = `${cookieName}=; ${pathStr} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0;`;
          });
        });
      });
    };

    // Set Google Translate cookie
    const setCookie = (lang) => {
      const hostname = window.location.hostname;
      const cookieValue = `/en/${lang}`;
      const maxAge = 31536000;

      document.cookie = `googtrans=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax;`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname}; max-age=${maxAge}; SameSite=Lax;`;
      
      const domainParts = hostname.split('.');
      if (domainParts.length > 1) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname}; max-age=${maxAge}; SameSite=Lax;`;
        
        if (domainParts.length > 2) {
          const parentDomain = domainParts.slice(-2).join('.');
          document.cookie = `googtrans=${cookieValue}; path=/; domain=.${parentDomain}; max-age=${maxAge}; SameSite=Lax;`;
        }
      }
    };

    // Update state
    setCurrentLang(lang);

    // Clear all cookies first
    clearCookies();

    // If switching to English, just reload
    if (lang === 'en') {
      setTimeout(() => {
        window.location.reload();
      }, 200);
      return;
    }

    // For other languages, set cookie then reload
    setTimeout(() => {
      setCookie(lang);
      
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }, 200);
  }

  const MENU_LIST = [
    { title: "Home", path: PATH.privateRoutes.HOME.path },
    { title: "Horoscope", path: "/daily-horoscope" },
    {
      title: "Astrologers",
      children: [
        {
          title: "Chat with Astrologer",
          path: PATH.privateRoutes.Chat_With_ASTROLOGER.path,
        },
        {
          title: "Talk to Astrologer",
          path: PATH.privateRoutes.TALK_TO_ASTROLOGER.path,
        },
      ],
    },
    {
      title: "Services",
      children: [
        { title: "Free Kundli", path: PATH.privateRoutes.KUNDLI.path },
        { title: "Match Making", path: PATH.privateRoutes.MATCHMAKING.path },
        { title: "Panchang", path: PATH.privateRoutes.PANCHANG.path },
        { title: "Compatibility", path: PATH.privateRoutes.COMPATIBILITY.path },
      ],
    },
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
          {currentLang === "en" ? "Eng" : "हिंदी"}
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
    {
      title: token ? (
        <div className={styles.avatarCircle}>
          <img
            src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="user"
            className={styles.avatar}
          />
        </div>
      ) : (
        <button
          className={`${styles.ctaButton} ${styles.hideOnMobile}`}
          onClick={() => navigate("/login?skip=welcome")}
        >
          LogIn
        </button>
      ),
      children: token && [
        {
          title: (
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
                  {user?.firstName || user?.phoneNumber}
                </PrimaryText>
                <PrimaryText size_12 isBold color="#466590" isCenter={true}>
                  {user?.phoneNumber}
                </PrimaryText>
              </div>
            </div>
          ),
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
      ],
    },
  ];

  const BOTTOM_MENU = [
    // {
    //   title: "Best Astrologers",
    //   children: [
    //     { title: "Vedic Astrologers", path: "/astro/vedic" },
    //     { title: "Tarot Experts", path: "/astro/tarot" },
    //   ],
    // },
    { title: "Numerology", path: "/numerology" },
    {
      title: "Calculators",
      children: [
        {
          title: "Love Calculator",
          path: "/love-calculator",
        },
        {
          title: "Atmakaraka and Darakaraka Calculator",
          path: "/atmakaraka-and-darakaraka-calculator",
        },
        {
          title: "Numerology Calculator",
          path: "/numerology-calculator",
        },
        {
          title: "Sun Sign Calculator",
          path: "/sun-sign-calculator",
        },
        {
          title: "Rising Sign Calculator / Ascendant Calculator",
          path: "/rising-ascendant-sign-calculator",
        },
        {
          title: "Rashi Calculator",
          path: "/rashi-calculator",
        },
        {
          title: "Dasha Calculator",
          path: "/dasha-calculator",
        },
        {
          title: "Mangal Dosha Calculator",
          path: "/mangal-dasha-calculator",
        },
        {
          title: "Shani Sade Sati Calculator",
          path: "/shani-sade-sati-calculator",
        },
        {
          title: "Birth Chart Calculator / Natal Chart Calculator",
          path: "/birth-natal-chart-calculator",
        },
        {
          title: "Kaal Sarp Dosh Calculator",
          path: "/kaal-sarpa-dosh-calculator",
        },
        {
          title: "Flames Calculator",
          path: "/flames-calculator",
        },
        {
          title: "Lucky Vehicle Number Calculator",
          path: "/lucky-vehicle-number-calculator",
        },
        {
          title: "Friendship Calculator",
          path: "/friendship-calculator",
        },
        {
          title: "Age Calculator",
          path: "/age-calculator",
        },
        {
          title: "Mobil Number Numerology Calculator",
          path: "/mobile-number-numerology-calculator",
        },
        {
          title: "Destiny Number Calculator",
          path: "/destiny-number-calculator",
        },
      ],
    },
    { title: "Chat with Astrologer", path: "/chat-to-astrologer" },
    { title: "Talk to Astrologer", path: "/talk-to-astrologer" },
    { title: "Join Live", path: "/live" },

    ...(isShubhMallEnabled() ? [{ title: "ShubhMall", path: "/shop" }] : []),
    // { title: "Shubhtalk Store", path: "/store" },
    { title: "Blogs", path: "/blog" },
    { title: "Recharge", path: "/recharge" },
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
    
    // Listen for auth changes (login, logout, registration)
    const handleAuthChange = () => {
      const updatedUser = getUserFromStorage();
      setUser(updatedUser);
    };
    
    // Sync language from cookie on mount
    const getCurrentLang = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    };

    const savedLang = getCurrentLang();
    setCurrentLang(savedLang);

    // Verify Google Translate widget is properly initialized
    if (savedLang !== "en") {
      const checkWidget = () => {
        const select = document.querySelector(".goog-te-combo");
        if (select && select.value !== savedLang) {
          select.value = savedLang;
          select.dispatchEvent(new Event("change"));
        }
      };
      
      const timer = setTimeout(checkWidget, 500);
      
      window.addEventListener("wallet-updated", handleWalletUpdated);
      window.addEventListener("auth-change", handleAuthChange);

      return () => {
        window.removeEventListener("wallet-updated", handleWalletUpdated);
        window.removeEventListener("auth-change", handleAuthChange);
        clearTimeout(timer);
      };
    }

    window.addEventListener("wallet-updated", handleWalletUpdated);
    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("wallet-updated", handleWalletUpdated);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []); //  IMPORTANT: empty dependency array

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
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
  const isActive = isMenuActive({ title, path, children }, location.pathname);

  const [open, setOpen] = useState(false);

  return (
    <li
      className={`${children ? styles.dropdown : ""} ${
        isActive ? styles.active : ""
      } ${open ? styles.open : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={!children ? () => navigate(path) : undefined}
    >
      <div className={styles.navItemLabel}>
        <PrimaryText size_14>{title}</PrimaryText>
        {children && <span className={styles.arrow}></span>}
      </div>

      {children && open && (
        <div className={styles.dropdownWrapper}>
          <ul className={styles.dropdownMenu}>
            {children.map((child, idx) => (
              <li
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false); //  CLOSE DROPDOWN
                  child?.onClick ? child.onClick() : navigate(child.path);
                }}
              >
                {child.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

const isMenuActive = (item, pathname) => {
  // 1️⃣ If any child is active → parent is active
  if (item.children) {
    const childActive = item.children.some(
      (child) =>
        child.path &&
        (pathname === child.path || pathname.startsWith(child.path + "/")),
    );

    if (childActive) return true;
  }

  // 2️⃣ Fallback to direct path match
  if (item.path) {
    return pathname === item.path || pathname.startsWith(item.path + "/");
  }

  return false;
};
