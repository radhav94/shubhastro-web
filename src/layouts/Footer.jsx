import styles from "./Footer.module.scss";
import ShubhTalkLogo from "../assets/images/ShubhAstrologoFooter.svg";
import ShubhAstroLogo from "../assets/images/ShubhAstrologo.svg";

import {
  IoLogoFacebook,
  IoLogoInstagram,
} from "react-icons/io5";
import { FaYoutube, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import { logout } from "../redux/auth/authSlice";
import BottomNavigation from "../screens/v2/home/components/BottomNavigation";
import { clearSelectedKundli } from "../redux/kundli/kundliSlice";

// ============================================================
// OLD FOOTER DATA (commented out — preserved for reference)
// ============================================================
// const quickLinks = [
//   { href: "/chat-with-astrologers", text: "Talk to Astrologer" },
//   { href: "/chat-with-astrologers", text: "Chat with Astrologer" },
//   { href: "/shubhmall", text: "ShubhMall" },
//   { href: "/tarot", text: "Tarot" },
//   { href: "/blog", text: "Blog" },
//   { href: "/tarot-card-selection", text: "Yes/No Tarot",
//     state: { reading: { id: 2, title: "Yes/ No Tarot", type: "Free", apiEndpoint: "yes-no" } }
//   },
// ];
// const usefulLinks = [
//   { href: "/aboutus", text: "About Us" },
//   { href: "/refund-and-cancellation-policy", text: "Refund & Cancellation Policy" },
//   { href: "/terms-conditions", text: "Terms & Conditions" },
//   { href: "/privacy-policy", text: "Privacy Policy" },
//   { href: "/disclaimer", text: "Disclaimer" },
//   { href: "/pricing-policy", text: "Pricing Policy" },
// ];
// ============================================================

// ============================================================
// NEW FOOTER DATA — Astrotalk-style multi-column layout
// ============================================================

// Column 1: Horoscope & Muhurat
const horoscopeLinks = [
  { href: "/horoscopes/daily-horoscope", text: "Daily Horoscope" },
  { href: "/horoscopes/weekly-horoscope", text: "Weekly Horoscope" },
  { href: "/horoscopes/monthly-horoscope", text: "Monthly Horoscope" },
  { href: "/horoscopes/yearly-horoscope", text: "Yearly Horoscope" },
];

// Column 2: Explore Services
const serviceLinks = [
  { href: "/shubhmall", text: "ShubhMall" },
  { href: "/talk-to-astrologers", text: "Live Astrologers" },
  { href: "/kundli", text: "Free Kundli" },
  { href: "/matchmaking", text: "Kundli Matching" },
  {href :"/tarot" , text : "Tarot"},
  { href: "/chat-with-astrologers", text: "Chat with Astrologer" },
  { href: "/talk-to-astrologers", text: "Talk to Astrologer" },
  { href: "/numerology", text: "Numerology" },
  { href: "/blog", text: "Blogs" },
];


// Column 4: Shop Our Products
const shopLinks = [
  { href: "/shubhmall?tab=bracelets", text: "Bracelets" },
  { href: "/shubhmall?tab=rudraksha", text: "Rudraksha" },
  { href: "/shubhmall?tab=murti", text: "Murti" },
  { href: "/shubhmall?tab=gemstones", text: "Gemstones" },
  { href: "/shubhmall?tab=yantra", text: "Yantra" },
  { href: "/shubhmall?tab=kavach", text: "Kavach" },
];

// Column 5: Company Policies
const companyLinks = [
  { href: "/refund-and-cancellation-policy", text: "Refund & Cancellation Policy" },
  { href: "/terms-conditions", text: "Terms & Conditions" },
  { href: "/privacy-policy", text: "Privacy Policy" },
  { href: "/disclaimer", text: "Disclaimer" },
  { href: "/aboutus", text: "About Us" },
  { href: "/pricing-policy", text: "Pricing Policy" },
];

const Footer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const role = localStorage.getItem("shubhtalk_role");

  const getToken = () => {
    return role === "ASTROLOGER"
      ? localStorage.getItem("shubhtalk_astro_token")
      : localStorage.getItem("shubhtalk_customer_token");
  };

  const [token, setToken] = useState(getToken());

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearSelectedKundli());

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
    setToken(null);
    navigate("/login");
  };

  useEffect(() => {
    const checkToken = () => {
      setToken(getToken());
    };
    window.addEventListener("storage", checkToken);
    return () => window.removeEventListener("storage", checkToken);
  }, []);

  const [openSection, setOpenSection] = useState(null);

  const toggleSection = useCallback((section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  }, []);

  // Reusable link list renderer
  const renderLinks = (links) => (
    <ul>
      {links.map((link, index) => (
        <li key={`${link.href}-${index}`}>
          <Link to={link.href} state={link.state}>
            {link.text}
          </Link>
        </li>
      ))}
    </ul>
  );

  // Accordion section for mobile
  const renderAccordionColumn = (id, title, links) => (
    <div className={styles.v2_column}>
      <div
        className={styles.v2_accordionHeader}
        onClick={() => toggleSection(id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggleSection(id)}
        aria-expanded={openSection === id}
      >
        <h4 className={styles.v2_heading}>{title}</h4>
        <span className={styles.v2_accordionIcon}>
          {openSection === id ? "−" : "+"}
        </span>
      </div>
      <div
        className={`${styles.v2_accordionBody} ${
          openSection === id ? styles.v2_accordionOpen : ""
        }`}
      >
        {renderLinks(links)}
      </div>
    </div>
  );

  return (
    <footer className={styles.footer}>

      {/* ============================================================ */}
      {/* OLD FOOTER UI (commented out — preserved for reference)      */}
      {/* ============================================================ */}
      {/*
      <div className={styles.footer_main}>
        <div className={styles.footer_column}>
          <img src={ShubhTalkLogo} alt="Shubh Talk Logo" className={styles.footer_logo} />
          <p className={styles.footer_tagline}>
            Your trusted guide to the cosmos. Find clarity and guidance from the best astrologers.
          </p>
          <div className={styles.social_icons}>
            <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><IoLogoFacebook /></a>
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><IoLogoInstagram /></a>
            <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a>
          </div>
        </div>
        <div className={styles.footer_column}>
          <h3 className={styles.column_title}>Quick Links</h3>
          <ul>
            {quickLinks.map((link, index) => (
              <li key={`${link.href}-${index}`}><Link to={link.href} state={link.state}>{link.text}</Link></li>
            ))}
          </ul>
        </div>
        <div className={styles.footer_column}>
          <h3 className={styles.column_title}>Useful Links</h3>
          <ul>
            {usefulLinks.map((link) => (
              <li key={link.href}><Link to={link.href}>{link.text}</Link></li>
            ))}
          </ul>
        </div>
        <div className={styles.footer_column}>
          <h3 className={styles.column_title}>Customer Support</h3>
          <p>Have questions?</p>
          <a href="mailto:support@shubhAstro.com" className={styles.support_link}>support@shubhAstro.com</a>
          <p>Or call us at</p>
          <a href="tel:+911234567890" className={styles.support_link}>+91 12345 67890</a>
        </div>
      </div>
      */}
      {/* ============================================================ */}
      {/* END OLD FOOTER UI                                            */}
      {/* ============================================================ */}

      {/* ============================================================ */}
      {/* NEW FOOTER UI — Astrotalk-style redesign                     */}
      {/* ============================================================ */}

      {/* Logo + Description */}
      <div className={styles.v2_top} style={location.pathname === '/home-new' ? { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' } : {}}>
        <div style={location.pathname === '/home-new' ? { flex: 1, maxWidth: 700 } : {}}>
          <img
            src={location.pathname === '/home-new' ? ShubhAstroLogo : ShubhTalkLogo}
            alt="ShubhAstro Logo"
            className={styles.v2_logo}
          />
          <p className={styles.v2_tagline}>
            Your trusted guide to the cosmos. Connect with the best astrologers from India.
            Get predictions related to Marriage, Love life, Career or Health over call, chat, query or report.
          </p>
        </div>
        {location.pathname === '/home-new' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280' }}>Follow Us</span>
            <div className={styles.v2_socialIcons}>
              <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><IoLogoFacebook /></a>
              <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
              <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><IoLogoInstagram /></a>
              <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
              <a href="https://twitter.com" aria-label="X" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a>
            </div>
          </div>
        )}
        {location.pathname !== '/home-new' && (
          <div className={styles.v2_socialIcons}>
            <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><IoLogoFacebook /></a>
            <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><IoLogoInstagram /></a>
            <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
            <a href="https://twitter.com" aria-label="X" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className={styles.v2_divider} />

      {/* Multi-column Links Grid — Desktop */}
      <div className={styles.v2_grid}>
        <div className={styles.v2_column}>
          <h4 className={styles.v2_heading}>Horoscope</h4>
          {renderLinks(horoscopeLinks)}
        </div>
        <div className={styles.v2_column}>
          <h4 className={styles.v2_heading}>Explore Services</h4>
          {renderLinks(serviceLinks)}
        </div>
        <div className={styles.v2_column}>
          <h4 className={styles.v2_heading}>Shop Our Products</h4>
          {renderLinks(shopLinks)}
        </div>
        <div className={styles.v2_column}>
          <h4 className={styles.v2_heading}>Company Policies</h4>
          {renderLinks(companyLinks)}
        </div>
        <div className={`${styles.v2_column} ${styles.v2_columnWide}`}>
          <h4 className={styles.v2_heading}>Contact Us</h4>
          <p className={styles.v2_contactText}>Have questions?</p>
          <a href="mailto:support@shubhtalk.com" className={styles.v2_emailLink}>
            support@shubhtalk.com
          </a>
          <p className={styles.v2_contactText}>Or call us at</p>
          <a href="tel:+911234567890" className={styles.v2_phoneLink}>
            +91 12345 67890
          </a>
          <h4 className={`${styles.v2_heading} ${styles.v2_heading_sub}`}>Download App</h4>
          <div className={styles.v2_storeButtons}>
            <a href="https://play.google.com/store/apps/details?id=com.shubhtalk" target="_blank" rel="noopener noreferrer" className={styles.v2_storeBtn}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#4CAF50"/>
                <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#F44336"/>
                <path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" fill="#FFC107"/>
                <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#2196F3"/>
              </svg>
              <div className={styles.v2_storeInfo}>
                <span className={styles.v2_storeLabel}>GET IT ON</span>
                <span className={styles.v2_storeName}>Google Play</span>
              </div>
            </a>
            <a href="https://apps.apple.com/app/shubhtalk/id123456789" target="_blank" rel="noopener noreferrer" className={styles.v2_storeBtn}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28C16.03 21.23 14.96 21.08 13.93 20.63C12.85 20.17 11.85 20.15 10.71 20.63C9.28 21.25 8.52 21.07 7.62 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C19.01 17.7 18.27 19.19 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z"/>
              </svg>
              <div className={styles.v2_storeInfo}>
                <span className={styles.v2_storeLabel}>Download on the</span>
                <span className={styles.v2_storeName}>App Store</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Accordion Footer */}
      <div className={styles.v2_mobileFooter}>
        {renderAccordionColumn("horoscope", "Horoscope", horoscopeLinks)}
        {renderAccordionColumn("services", "Explore Services", serviceLinks)}
        {renderAccordionColumn("shop", "Shop Our Products", shopLinks)}
        {renderAccordionColumn("company", "Company Policies", companyLinks)}

        {/* Customer Support — always visible, no accordion */}
        <div className={styles.v2_column}>
          <h4 className={styles.v2_heading}>Customer Support</h4>
          <p className={styles.v2_contactText}>Have questions?</p>
          <a href="mailto:support@shubhtalk.com" className={styles.v2_emailLink}>
            support@shubhtalk.com
          </a>
          <p className={styles.v2_contactText}>Or call us at</p>
          <a href="tel:+911234567890" className={styles.v2_phoneLink}>
            +91 12345 67890
          </a>

          <h4 className={`${styles.v2_heading} ${styles.v2_heading_sub}`}>Download App</h4>
          <div className={styles.v2_storeButtons}>
            <a href="https://play.google.com/store/apps/details?id=com.shubhtalk" target="_blank" rel="noopener noreferrer" className={styles.v2_storeBtn}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5Z" fill="#4CAF50"/>
                <path d="M16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12Z" fill="#F44336"/>
                <path d="M20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81Z" fill="#FFC107"/>
                <path d="M6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="#2196F3"/>
              </svg>
              <div className={styles.v2_storeInfo}>
                <span className={styles.v2_storeLabel}>GET IT ON</span>
                <span className={styles.v2_storeName}>Google Play</span>
              </div>
            </a>
            <a href="https://apps.apple.com/app/shubhtalk/id123456789" target="_blank" rel="noopener noreferrer" className={styles.v2_storeBtn}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28C16.03 21.23 14.96 21.08 13.93 20.63C12.85 20.17 11.85 20.15 10.71 20.63C9.28 21.25 8.52 21.07 7.62 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C19.01 17.7 18.27 19.19 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z"/>
              </svg>
              <div className={styles.v2_storeInfo}>
                <span className={styles.v2_storeLabel}>Download on the</span>
                <span className={styles.v2_storeName}>App Store</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.v2_bottomOuter}>
        <div className={styles.v2_bottomBar}>
          <p>© {currentYear} ShubhAstro Pvt. Ltd. All rights reserved</p>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-conditions">T&C</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Navigation - Hidden on home page */}
      {location.pathname !== "/" && <BottomNavigation />}
    </footer>
  );
};

export default Footer;
