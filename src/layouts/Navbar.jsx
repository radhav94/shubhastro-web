import React from "react";
import styles from "./Navbar.module.scss";
import PrimaryText from "../component/PrimaryText";
import { Link, useLocation } from "react-router-dom";
import { PATH } from "../utils/routes/Paths";

const Navbar = () => {
  const MENU_LIST = [
    { title: "Home", path: PATH.privateRoutes.HOME.path },
    {
      title: "Horoscope",
      children: [
        { title: "Daily Horoscope", path: "/daily-horoscope" },
        {
          title: "Monthly Horoscope",
          path: PATH.privateRoutes.HOROSCOPE.MONTHLY.path,
        },
      ],
    },
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
    { title: "Free Kundli", path: PATH.privateRoutes.KUNDLI.path },
    // { title: "Sadesati", path: PATH.privateRoutes.SADESATI.path },
    { title: "Match Making", path: PATH.privateRoutes.MATCHMAKING.path },
    {
      title: "Tarot",
      path: PATH.privateRoutes.TAROT_CARD_V2.path,
      children: [
        {
          title: "Shuffle Tarot",
          path: PATH.privateRoutes.TAROT_CARD_V2.path,
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
    { title: "Shop", path: PATH.privateRoutes.SHOP.path },
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

const NavbarItem = ({ title, path, children }) => {
  const location = useLocation();
  const isActive = path && location.pathname === path;

  return (
    <li
      className={`${children ? styles.dropdown : ""} ${
        isActive ? styles.active : ""
      }`}
    >
      {/* FIXED ALIGNMENT WRAPPER */}
      {path && !children ? (
        <Link to={path} className={styles.navItemLabel} style={{ textDecoration: "none", color: "inherit" }}>
          <PrimaryText size_14>{title}</PrimaryText>
        </Link>
      ) : (
        <div className={styles.navItemLabel}>
          <PrimaryText size_14>{title}</PrimaryText>
          {children && <span className={styles.arrow}></span>}
        </div>
      )}

      {children && (
        <div className={styles.dropdownWrapper}>
          <ul className={styles.dropdownMenu}>
            {children.map((child, idx) => (
              <li key={idx}>
                <Link to={child.path} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};
