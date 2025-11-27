import React from "react";
import styles from "./Navbar.module.scss";
import PrimaryText from "../component/PrimaryText";
import { useLocation, useNavigate } from "react-router-dom";
import { PATH } from "../utils/routes/Paths";

const Navbar = () => {
  const MENU_LIST = [
    { title: "Home", path: PATH.privateRoutes.HOME.path },
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
    // { title: "Numerology", path: PATH.privateRoutes.NUMEROLOGY.path },
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
      ],
    },
    // { title: "Blog", path: PATH.privateRoutes.BLOG.path },
    // { title: "Free Readings", path: PATH.privateRoutes.FREE_READINGS.path },

    // { title: "Video", path: PATH.privateRoutes.VIDEO.path },

    // { title: "Session Booking", path: PATH.privateRoutes.SESSION_DETAILS.path },
    // {
    //   title: "Yogii Mall",
    //   path: PATH.privateRoutes.SHOP.path,
    //   tag: "New",
    //   tagType: "new",
    // },
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
      <PrimaryText size_14>
        {title} {children && <span className={styles.arrow}></span>}
      </PrimaryText>

      {children && (
        <div className={styles.dropdownWrapper}>
          <ul className={styles.dropdownMenu}>
            {children.map((child, idx) => (
              <li key={idx} onClick={() => navigate(child.path)}>
                {child.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};
