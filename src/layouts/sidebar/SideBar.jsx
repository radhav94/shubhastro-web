import React, { useState, useRef, useCallback } from "react";
import styles from "./SideBar.module.scss";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { PrimaryText } from "../../component";
import { PATH } from "../../utils/routes/Paths";
import { getUserFromStorage } from "../../utils/authStorage";
import { logout } from "../../redux/auth/authSlice";
import { clearSelectedKundli } from "../../redux/kundli/kundliSlice";
import { clearAllCalculatorData } from "../../redux/calculator/calculatorSlice";
import { isShubhMallEnabled } from "../../utils/featureConfig";

const SideBar = ({ open, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Accordion state. Keyed by "<group>-<index>" rather than a bare index:
  // renderMenuItem is called from two separate maps (MENU_LIST and BOTTOM_MENU)
  // that both start counting at 0, so a shared numeric index meant item 3 of one
  // group and item 3 of the other were the same accordion slot. Nothing collides
  // at today's data (BOTTOM_MENU has no children) but it broke the moment one
  // was added.
  const [openKey, setOpenKey] = useState(null);
  // Measured pixel height of the open panel, so the max-height transition has a
  // concrete target to animate to. See toggleDropdown.
  const [openHeight, setOpenHeight] = useState(0);
  const rowRefs = useRef(new Map());
  const panelRefs = useRef(new Map());
  const user = getUserFromStorage();

  const role = localStorage.getItem("shubhtalk_role");
  const token =
    role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");

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

  const handleLogout = () => {
    // Dispatch Redux logout action
    dispatch(logout());
     dispatch(clearSelectedKundli());
     dispatch(clearAllCalculatorData());
    
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

    // Set Google Translate cookie - scoped to current hostname only
    const setCookie = (lang) => {
      const hostname = window.location.hostname;
      const cookieValue = `/en/${lang}`;
      const maxAge = 31536000;

      // Only set cookie for the current exact hostname, not parent domains
      document.cookie = `googtrans=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax;`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname}; max-age=${maxAge}; SameSite=Lax;`;
    };

    // Update state
    setCurrentLang(lang);
    
    // Close sidebar
    onClose();

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
        { title: "Today's Horoscope", path: "/horoscope/todays-horoscope" },
        { title: "Daily Horoscope", path: "/daily-horoscope" },
        { title: "Yearly Horoscope", path: "/yearly-horoscope" },
        { title: "Weekly Horoscope", path: "/weekly-horoscope" },
      ],
    },
    { title: "Compatibility", path: PATH.privateRoutes.COMPATIBILITY.path },
    {
      title: "Tarot",
      path: PATH.privateRoutes.TAROT_CARD_V2.path,
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
          {currentLang === "en" ? "English" : currentLang === "mr" ? "मराठी" : "हिंदी"}
        </span>
      ),
      children: [
        currentLang !== "en" && {
          title: "English",
          onClick: () => handleLanguageChange("en"),
        },
        currentLang !== "hi" && {
          title: "हिंदी",
          onClick: () => handleLanguageChange("hi"),
        },
        currentLang !== "mr" && {
          title: "मराठी",
          onClick: () => handleLanguageChange("mr"),
        },
      ].filter(Boolean),
    },
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
        {
          title: "Mulank Calculator",
          path: "/mulank-calculator",
        },
        {
          title: "Name Compatibility",
          path: "/name-compatibility-calculator",
        },
        {
          title: "Lo Shu Grid Calculator",
          path: "/lo-shu-grid-calculator",
        },
        {
          title: "Lucky Name Numerology",
          path: "/lucky-name-numerology-calculator",
        },
      ],
    },
  ];

  const BOTTOM_MENU = [
    { title: "Chat with Astrologer", path: "/astrologers" },
    { title: "Talk to Astrologer", path: "/astrologers" },
    { title: "Join Live", path: "/live" },
    ...(isShubhMallEnabled() ? [{ title: "ShubhMall", path: "/shop" }] : []),
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

  const toggleDropdown = useCallback(
    (key) => {
      const next = openKey === key ? null : key;
      setOpenKey(next);

      if (!next) return;

      // Give the max-height transition a real target. scrollHeight reports the
      // full content height even while the panel is clamped to 0 by
      // overflow: hidden.
      const panel = panelRefs.current.get(next);
      setOpenHeight(panel ? panel.scrollHeight : 0);

      // Scroll the row we just expanded to the top of the menu.
      //
      // This is the actual dead-click fix. The submenu renders *below* the row
      // that was tapped, inside .menuContainer — a flex: 1 / overflow-y: auto
      // scroll container. "Calculators" is the last item in MENU_LIST with 20
      // children, and BOTTOM_MENU plus the user menu sit under it, so on a phone
      // (worse in an in-app browser, which eats viewport height with its own
      // chrome) the row sits near the bottom and everything that appears on tap
      // lands off-screen. The only on-screen change was the chevron flipping
      // 18px, which is why Clarity logged the tap as dead and the visitor left
      // ten seconds later.
      requestAnimationFrame(() => {
        rowRefs.current.get(next)?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    },
    [openKey]
  );

  const renderMenuItem = (item, index, isBottomMenu = false) => {
    const group = isBottomMenu ? "bottom" : "main";
    const key = `${group}-${index}`;

    if (!item.children) {
      return (
        <li key={index} className={styles.menuItem}>
          <button
            type="button"
            className={`${styles.menuLink} ${
              isBottomMenu ? styles.bottomMenu : ""
            }`}
            onClick={() => handleClick(item.path, item.onClick)}
          >
            {typeof item.title === "string" ? item.title : item.title}
          </button>
        </li>
      );
    }

    const isOpen = openKey === key;
    const panelId = `sidebar-submenu-${key}`;

    return (
      <li key={index} className={styles.menuItem}>
        <button
          type="button"
          ref={(el) => {
            if (el) rowRefs.current.set(key, el);
            else rowRefs.current.delete(key);
          }}
          className={`${styles.parentRow} ${
            isBottomMenu ? styles.bottomMenu : ""
          }`}
          onClick={() => toggleDropdown(key)}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span>
            {typeof item.title === "string" ? item.title : item.title}
          </span>
          {isOpen ? (
            <FiChevronUp className={styles.chevron} />
          ) : (
            <FiChevronDown className={styles.chevron} />
          )}
        </button>

        {/* Accordion Submenu */}
        <ul
          id={panelId}
          ref={(el) => {
            if (el) panelRefs.current.set(key, el);
            else panelRefs.current.delete(key);
          }}
          className={styles.submenu}
          // A percentage max-height used to drive this open, which resolved
          // against an auto-height <li> and so was treated as `none` — it worked
          // by accident and the transition never ran, because you cannot
          // interpolate to `none`. An explicit measured height animates, and it
          // cannot silently clamp to zero if .menuItem ever gains a height.
          style={{ maxHeight: isOpen ? `${openHeight}px` : 0 }}
          aria-hidden={!isOpen}
        >
          {item.children.map((child, idx) => (
            <li key={idx} className={styles.submenuItem}>
              <button
                type="button"
                className={styles.submenuLink}
                // Collapsed panels are only hidden by overflow, so their
                // contents stay in the tab order without this.
                tabIndex={isOpen ? 0 : -1}
                onClick={() => handleClick(child.path, child.onClick)}
              >
                {typeof child.title === "string"
                  ? child.title
                  : renderUserProfile(child.title)}
              </button>
            </li>
          ))}
        </ul>
      </li>
    );
  };

  const renderUserProfile = (content) => {
    if (
      content &&
      content.props &&
      content.props.className?.includes("userInfo")
    ) {
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
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <FiX className={styles.closeIcon} />
          </button>
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
            {BOTTOM_MENU.map((item, index) =>
              renderMenuItem(item, index, true)
            )}
          </ul>

          {/* Divider */}
          {/* <div className={styles.divider}></div> */}

          {/* User Menu Items */}
          <ul className={styles.menuList}>
            {USER_MENU_ITEMS.map((item, index) => (
              <li key={index} className={styles.menuItem}>
                <button
                  type="button"
                  className={styles.menuLink}
                  onClick={() => handleClick(item.path, item.onClick)}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default SideBar;
