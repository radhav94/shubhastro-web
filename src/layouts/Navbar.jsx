import React from "react";
import styles from "./Navbar.module.scss";
import PrimaryText from "../component/PrimaryText";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "../utils/routes/Paths";

const Navbar = () => {
  // menuList
  const MENU_LIST = [
    { title: "Home", path: PATH.privateRoutes.HOME.path },
    { title: "Consult Now", path: PATH.privateRoutes.TALK_TO_ASTROLOGER.path },
    { title: "Horoscope", path: PATH.privateRoutes.HOROSCOPE.path },
    {
      title: "Yogi Live",
      path: PATH.privateRoutes.ASTRO_LIVE.path,
      tag: "Watch",
      tagType: "watch",
    },
    { title: "Panchang", path: PATH.privateRoutes.PANCHANG.path },
    // {
    //   title: "Year 2025",
    //   children: [
    //     { title: "2025 Overview", path: PATH.privateRoutes.PROFILE.path },
    //     { title: "Love Horoscope", path: PATH.privateRoutes.PROFILE.path },
    //     { title: "Career Horoscope", path: PATH.privateRoutes.PROFILE.path },
    //   ],
    // },

    { title: "Kundli", path: PATH.privateRoutes.KUNDLI.path },
    { title: "Numerology", path: PATH.privateRoutes.NUMEROLOGY.path },
    { title: "Tarot", path: PATH.privateRoutes.TAROT.path },
    { title: "Free Readings", path: PATH.privateRoutes.FREE_READINGS.path },

    { title: "Video", path: PATH.privateRoutes.VIDEO.path },
    { title: "Blog", path: PATH.privateRoutes.BLOG.path },
    { title: "Session Booking", path: PATH.privateRoutes.SESSION_DETAILS.path },
    {
      title: "Yogii Mall",
      path: PATH.privateRoutes.SHOP.path,
      tag: "New",
      tagType: "new",
    },
  ];

  return (
    <header className={styles.navbar}>
      <nav className={styles.navbarMenu}>
        <ul>
          {MENU_LIST.map((item, index) => (
            <NavbarItem key={index} {...item} />
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;

const NavbarItem = ({ title, path, tag, tagType, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (path) {
      navigate(path);
    }
  };

  // Check if current item is active
  const isActive = path && location.pathname === path;

  return (
    <li
      className={`${children ? styles.dropdown : ""} ${
        isActive ? styles.active : ""
      }`}
      onClick={!children ? handleClick : undefined}
    >
      <PrimaryText size_14>
        {title} {children && <span className={styles.arrow}></span>}
      </PrimaryText>

      {tag && (
        <span
          className={`${styles.tag} ${
            tagType === "new" ? styles.new : styles.watch
          }`}
        >
          {tag}
        </span>
      )}

      {children && (
        <div className={styles.dropdownWrapper}>
          <ul className={styles.dropdownMenu}>
            {children.map((child, idx) => {
              const childActive = location.pathname === child.path;
              return (
                <li
                  key={idx}
                  className={childActive ? styles.active : ""}
                  onClick={() => navigate(child.path)}
                >
                  {child.title}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
};
