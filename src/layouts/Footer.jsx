import styles from "./Footer.module.scss";
import ShubhTalkLogo from "../assets/icons/logo.png"; // Assuming you have your logo in an assets folder

// Importing icons for a cleaner, more modern approach
import {
  IoHomeOutline,
  IoCallOutline,
  IoStorefrontOutline,
  IoPlayCircleOutline,
  IoPersonCircleOutline,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
} from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import { Home, Compass, Radio, UserRound, Store } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { logout } from "../redux/auth/authSlice";

// Data for links - easy to manage and update
const quickLinks = [
  { href: "/talk-to-astrologers", text: "Talk to Astrologer" },
  { href: "/chat-with-astrologers", text: "Chat with Astrologer" },
  { href: "/tarot/yes-no-tarot", text: "Yes/No Tarot" },
  { href: "/tarot/love-triangle", text: "Love Traingle" },
];

const usefulLinks = [
  { href: "/aboutus", text: "About Us" },
  {
    href: "/refund-and-cancellation-policy",
    text: "Refund & Cancellation Policy",
  },
  { href: "/terms-conditions", text: "Terms & Conditions" },
  { href: "/privacy-policy", text: "Privacy Policy" },
  { href: "/disclaimer", text: "Disclaimer" },
  { href: "/pricing-policy", text: "Pricing Policy" },
];

const Footer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const currentYear = new Date().getFullYear();

  // -------------------------------
  // ✅ Detect Role + Token Correctly
  // -------------------------------
  const role = localStorage.getItem("shubhtalk_role");

  const getToken = () => {
    return role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
  };

  const [token, setToken] = useState(getToken());

  // -------------------------------
  // ✅ Logout Handler for Both Roles
  // -------------------------------
  const handleLogout = () => {
    // Dispatch Redux logout action
    dispatch(logout());
    
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

    setToken(null); // re-render UI
    navigate("/login");
  };

  // Re-check token on changes
  useEffect(() => {
    const checkToken = () => {
      setToken(getToken());
    };

    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, []);

  // -------------------------------
  // Mobile Bottom Nav (Old version - kept for backward compatibility)
  // -------------------------------
  const mobileNavLinks = [
    { href: "/", icon: <IoHomeOutline />, text: "Home" },
    { href: "/talk-to-astrologers", icon: <IoCallOutline />, text: "Talk" },
    { href: "/shop", icon: <IoStorefrontOutline />, text: "Mall", new: true },
    { href: "/astrologer-live", icon: <IoPlayCircleOutline />, text: "Live" },
    token
      ? {
          href: "#",
          icon: <TbLogout />,
          text: "Logout",
          onClick: handleLogout,
        }
      : {
          href: "/login",
          icon: <IoPersonCircleOutline />,
          text: "Login",
        },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footer_main}>
          <div className={styles.footer_column}>
            <img
              src={ShubhTalkLogo}
              alt="Shubh Talk Logo"
              className={styles.footer_logo}
            />
            <p className={styles.footer_tagline}>
              Your trusted guide to the cosmos. Find clarity and guidance from
              the best astrologers.
            </p>
            <div className={styles.social_icons}>
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IoLogoFacebook />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IoLogoInstagram />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IoLogoTwitter />
              </a>
            </div>
          </div>

          <div className={styles.footer_column}>
            <h3 className={styles.column_title}>Quick Links</h3>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href}>{link.text}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer_column}>
            <h3 className={styles.column_title}>Useful Links</h3>
            <ul>
              {usefulLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href}>{link.text}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer_column}>
            <h3 className={styles.column_title}>Customer Support</h3>
            <p>Have questions?</p>
            <a
              href="mailto:support@shubhtalk.com"
              className={styles.support_link}
            >
              support@shubhtalk.com
            </a>
            <p>Or call us at</p>
            <a href="tel:+911234567890" className={styles.support_link}>
              +91 12345 67890
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.footer_bottom}>
          <p>© 2001-{currentYear} Shubh Talk Pvt. Ltd. All rights reserved</p>
          <ul>
            <li>
              <Link to="/policy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/termandcondition">T&C</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Sticky PWA Footer Navigation (Old version) */}
      <div className={styles.pwa_footer}>
        <nav>
          <ul>
            {mobileNavLinks.map((link) => (
              <li key={link.text}>
                <a
                  href={link.href}
                  className={link.active ? styles.active : ""}
                  onClick={(e) => {
                    if (link.onClick) {
                      e.preventDefault(); // stop page reload
                      link.onClick();
                    }
                  }}
                >
                  <div className={styles.nav_icon}>
                    {link.icon}
                    {link.new && <span className={styles.new_badge}>New</span>}
                  </div>
                  <span className={styles.nav_text}>{link.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* New Bottom Navigation (Modern Design) */}
      <nav className={styles.bottomNav}>
        <button 
          className={`${styles.navItem} ${location.pathname === "/" ? styles.active : ""}`} 
          onClick={() => navigate("/")}
        >
          <div className={styles.iconCircle}>
            <Home size={22} />
          </div>
          <span className={styles.label}>Home</span>
          {location.pathname === "/" && <span className={styles.activeLine} />}
        </button>

        <button 
          className={`${styles.navItem} ${location.pathname.startsWith("/talk-to-astrologers") || location.pathname.startsWith("/chat-with-astrologers") ? styles.active : ""}`} 
          onClick={() => navigate("/talk-to-astrologers")}
        >
          <div className={styles.iconCircle}>
            <Compass size={22} />
          </div>
          <span className={styles.label}>Explore</span>
          {(location.pathname.startsWith("/talk-to-astrologers") || location.pathname.startsWith("/chat-with-astrologers")) && <span className={styles.activeLine} />}
        </button>

        <button 
          className={styles.liveItem} 
          onClick={() => navigate("/astrologer-live")}
        >
          <div className={styles.liveCircle}>
            <Radio size={22} />
          </div>
          <span className={styles.liveLabel}>LIVE</span>
        </button>

        <button 
          className={`${styles.navItem} ${location.pathname.startsWith("/shop") ? styles.active : ""}`} 
          onClick={() => navigate("/shop")}
        >
          <div className={styles.iconCircle}>
            <Store size={22} />
          </div>
          <span className={styles.label}>Shop</span>
          {location.pathname.startsWith("/shop") && <span className={styles.activeLine} />}
        </button>

        <button 
          className={`${styles.navItem} ${location.pathname.startsWith("/profile") ? styles.active : ""}`} 
          onClick={() => navigate("/profile")}
        >
          <div className={styles.iconCircle}>
            <UserRound size={22} />
          </div>
          <span className={styles.label}>Profile</span>
          {location.pathname.startsWith("/profile") && <span className={styles.activeLine} />}
        </button>
      </nav>
    </footer>
  );
};

export default Footer;
