import styles from "./Footer.module.scss";
import ShubhAstroLogo from "../assets/images/ShubhAstrologo.png";

import {
  IoLogoFacebook,
  IoLogoInstagram,
} from "react-icons/io5";
import { FaYoutube, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { Link, NavLink } from "react-router-dom";
import { useState, useCallback } from "react";
import { isShubhMallEnabled } from "../utils/featureConfig";
import { trackEvent } from "../utils/analytics";
import {
  PLAY_STORE_URL,
  APP_STORE_URL,
} from "../utils/helper/appStoreLinks";

// Footer link data
const horoscopeLinks = [
  { href: "/daily-horoscope", text: "Daily Horoscope" },
  { href: "/tomorrow-horoscope", text: "Tomorrow Horoscope"},
  { href: "/weekly-horoscope", text: "Weekly Horoscope" },
  { href: "/yearly-horoscope", text: "Yearly Horoscope" },
];

const serviceLinks = [
  ...(isShubhMallEnabled() ? [{ href: "/shubh-mall", text: "ShubhMall" }] : []),
  { href: "/astrologers", text: "Live Astrologers" },
  { href: "/kundli", text: "Free Kundli" },
  { href: "/match-making", text: "Kundli Matching" },
  { href: "/tarot", text: "Tarot" },
  // { href: "/astrologers", text: "Chat with Astrologer" },
  // { href: "/astrologers", text: "Talk to Astrologer" },
  { href: "/numerology", text: "Numerology" },
  { href: "/blog", text: "Blog" },
  { href: "/important-links", text: "Important Links" },
];

const shopLinks = isShubhMallEnabled()
  ? [
      { href: "/shubh-mall?tab=bracelets", text: "Bracelets" },
      { href: "/shubh-mall?tab=rudraksha", text: "Rudraksha" },
      { href: "/shubh-mall?tab=murti", text: "Murti" },
      { href: "/shubh-mall?tab=gemstones", text: "Gemstones" },
      { href: "/shubh-mall?tab=yantra", text: "Yantra" },
      { href: "/shubh-mall?tab=kavach", text: "Kavach" },
    ]
  : [];

/*
  Registered office address.

  Was a bare <p> inside the Contact Us column, duplicated verbatim in the
  desktop and mobile blocks. On a phone a postal address is expected to open a
  map — that is what a tap on one means — and this one had no anchor, no map
  link and no copy affordance, so the tap did nothing. It also sat directly
  under a bold <h4> whose class is literally named `v2_phoneLink`, which reads
  as "tap for directions", and the footer's only phone number is commented out,
  so there was nothing else in the column to reach for except the email.

  `?api=1&query=` is Google's documented cross-platform Maps search URL: it
  hands off to the Maps app on Android/iOS and opens the web map elsewhere.
  Defined once here so the two copies cannot drift apart.
*/
const REGISTERED_ADDRESS =
  "Vaibhav Chambers, 9th Rd, opposite Income Tax Office, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051";
const REGISTERED_ADDRESS_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  REGISTERED_ADDRESS,
)}`;

const companyLinks = [
  { href: "/about-us", text: "About Us" },
  { href: "/faq", text: "FAQ" },
  { href: "/refund-cancellation-policy", text: "Refund & Cancellation Policy" },
  { href: "/terms-and-conditions", text: "Terms & Conditions" },
  { href: "/privacy-policy", text: "Privacy Policy" },
  { href: "/disclaimer", text: "Disclaimer" },
  { href: "/pricing-policy", text: "Pricing Policy" },
  { href: "/ai-use-policy", text: "AI Use Policy" },
  { href: "/astrologer-onboarding-agreement", text: "Onboarding Agreement" },
  { href: "/live-chat-policy", text: "Live Chat Policy" },
  { href: "/user-agreement", text: "User Agreement" },
  { href: "/onboarding-guide", text: "Onboarding Guide" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  /*
    "contact", not null: the mobile Contact Us column is an accordion now (see
    renderAccordionShell) and it opens expanded, so the email, registered address
    and legal name are on screen exactly as they were before this change. Only the
    heading's behaviour is new.
  */
  const [openSection, setOpenSection] = useState("contact");

  const toggleSection = useCallback((section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  }, []);

  /*
    NavLink rather than Link so the entry for the page you are already on is
    marked. The header already does this (TopHeader uses NavLink + styles.active
    throughout) but the footer did not, and the footer is where the Blog entry
    lives — the header's Blog NavLink is commented out. With no "you are here"
    signal, visitors already on /blog clicked "Blog" again, which navigates to
    the same URL and changes nothing visible: a dead click.

    `end` so a parent path isn't marked active for its children — /blog should
    not stay highlighted while reading /blog/<slug>.
  */
  const renderLinks = (links) => (
    <ul>
      {links.map((link, index) => (
        <li key={`${link.href}-${index}`}>
          <NavLink
            to={link.href}
            state={link.state}
            end
            className={({ isActive }) => (isActive ? styles.v2_activeLink : undefined)}
          >
            {link.text}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  /*
    Accordion shell, taking arbitrary body content.

    Generalised from the links-only version so the mobile "Contact Us" column can
    use it too. That column was a plain <h3> in the same `.v2_heading` style,
    stacked directly under three headings that ARE toggles — so it reads as the
    fourth one and gets tapped, and did nothing at all. Clarity: a visitor tapped
    "Contact Us" at 00:14, and again at 03:28, with dead clicks and a refresh in
    between; they had also used the "Explore Services" accordion, so they knew
    these headings open.

    Contact starts expanded (see the `openSection` initial value), so nothing that
    was previously visible is hidden on arrival — the tap now collapses it, which
    is a visible answer either way.
  */
  const renderAccordionShell = (id, title, body, { tall = false } = {}) => (
    <div className={styles.v2_column}>
      <div
        className={styles.v2_accordionHeader}
        onClick={() => toggleSection(id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && toggleSection(id)}
        aria-expanded={openSection === id}
      >
        <h3 className={styles.v2_heading}>{title}</h3>
        <span className={styles.v2_accordionIcon}>{openSection === id ? "−" : "+"}</span>
      </div>
      {/* `tall` raises the open max-height for bodies that are not a short link
          list — the contact block carries a wrapping postal address and would be
          clipped by the 500px used for the link columns. */}
      <div
        className={`${styles.v2_accordionBody} ${
          openSection === id ? (tall ? styles.v2_accordionOpenTall : styles.v2_accordionOpen) : ""
        }`}
      >
        {body}
      </div>
    </div>
  );

  const renderAccordionColumn = (id, title, links) =>
    renderAccordionShell(id, title, renderLinks(links));

  /*
    These links carry target="_blank", so the tab being recorded never
    navigates — the store opens in a new one. Session recorders can only observe
    the original tab, so a working click is indistinguishable from a broken one
    and gets reported as a dead click on "Download App". Three separate Clarity
    reports for one visitor read as "did not lead to navigation, possibly a
    broken link"; the link resolves to a live listing (verified 200, real app
    page), it just cannot be seen from the recorded tab.

    An explicit event is the only way to know whether these are actually being
    used. Fires before the browser opens the new tab, and trackEvent already
    swallows its own failures, so it cannot interfere with the navigation.
  */
  const trackStoreClick = (store) => {
    trackEvent("app_store_click", { store, location: "footer" });
  };

  const storeButtons = (
    <div className={styles.v2_storeButtons}>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.v2_storeBtn}
        onClick={() => trackStoreClick("google_play")}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
      {/*
        The App Store button is hidden entirely until there is an iOS build to
        link to, rather than shown as a "Coming soon" placeholder.
        APP_STORE_URL is the single gate, so publishing the app is a one-line
        change in utils/helper/appStoreLinks.js and this reappears.

        Previously this rendered a <button> that toasted an explanation, which
        was itself a fix for an <a> pointing at Apple's example ID
        (`id123456789`) — a guaranteed 404 that produced rage clicks. Not
        advertising an app that does not exist removes the dead end outright.
      */}
      {APP_STORE_URL && (
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.v2_storeBtn}
          onClick={() => trackStoreClick("app_store")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.05 20.28C16.03 21.23 14.96 21.08 13.93 20.63C12.85 20.17 11.85 20.15 10.71 20.63C9.28 21.25 8.52 21.07 7.62 20.28C2.79 15.25 3.51 7.59 9.05 7.31C10.4 7.38 11.34 8.05 12.13 8.11C13.31 7.87 14.44 7.18 15.7 7.27C17.21 7.39 18.35 7.99 19.1 9.07C15.98 10.94 16.72 15.05 19.58 16.2C19.01 17.7 18.27 19.19 17.04 20.29L17.05 20.28ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3C16.06 5.58 13.43 7.5 12.03 7.25Z"/>
          </svg>
          <div className={styles.v2_storeInfo}>
            <span className={styles.v2_storeLabel}>Download on the</span>
            <span className={styles.v2_storeName}>App Store</span>
          </div>
        </a>
      )}
    </div>
  );

  return (
    <footer className={styles.footerLight}>

      {/* Desktop Grid — Logo + all columns */}
      <div className={styles.v2_grid}>

        {/* Logo + Tagline + Social */}
        <div className={`${styles.v2_column} ${styles.v2_logoCol}`}>
          <img src={ShubhAstroLogo} alt="ShubhAstro Logo" width="150" height="27" className={styles.v2_logo} />
          <p className={styles.v2_tagline}>
           ShubhAstro.ai offers AI-powered astrology guidance for love, marriage, career, finance, and life decisions through Kundli, Numerology, Palmistry, Face Reading, Signature Analysis and Vastu.</p>
          <p className={styles.v2_followLabel}>Follow Us</p>
          <div className={styles.v2_socialIcons}>
            <a href="https://www.facebook.com/profile.php?id=61589408862522" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><IoLogoFacebook /></a>
            <a href="https://www.youtube.com/@ShubhAstroofficial" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://www.instagram.com/shubhastroofficial/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><IoLogoInstagram /></a>
            <a href="https://www.linkedin.com/company/shubhastro-ai" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
            {/* <a href="https://twitter.com" aria-label="X" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a> */}
          </div>
        </div>

        <div>
          <div className={styles.v2_column}>
            <h3 className={styles.v2_heading}>Horoscope</h3>
            {renderLinks(horoscopeLinks)}
          </div>

          <div className={styles.v2_column} style={{marginTop:"16px"}}>
            <h3 className={styles.v2_heading}>Explore Services</h3>
            {renderLinks(serviceLinks)}
          </div>
        </div>

        {/* {isShubhMallEnabled() && (
          <div className={styles.v2_column}>
            <h3 className={styles.v2_heading}>Shop Our Products</h3>
            {renderLinks(shopLinks)}
          </div>
        )} */}

        <div className={styles.v2_column}>
          <h3 className={styles.v2_heading}>Company Policies</h3>
          {renderLinks(companyLinks)}
        </div>

        <div className={`${styles.v2_column} ${styles.v2_columnWide}`}>
          <h3 className={styles.v2_heading}>Contact Us</h3>
          <p className={styles.v2_contactText}>Have questions?</p>
          <a href="mailto:connect@pittiegroup.com" className={styles.v2_emailLink}>connect@pittiegroup.com</a>
          {/* <p className={styles.v2_contactText}>Or call us at</p>
          <a href="tel:+918655682877" className={`${styles.v2_contactText} ${styles.v2_callUs}`}>+91 86556 82877</a> */}
          <h4 className={`${styles.v2_phoneLink}`}>Registered Company Address</h4>
          <a
            href={REGISTERED_ADDRESS_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.v2_contactText} ${styles.v2_addressLink}`}
          >
            {REGISTERED_ADDRESS}
          </a>
          <h4 className={`${styles.v2_phoneLink}`}>Legal Company Name</h4>
          <p className={styles.v2_contactText}>PITTIE GLOBAL PRIVATE LIMITED</p>
        </div>
        
        <div className={`${styles.v2_column} ${styles.v2_columnWide}`}>
          <h3 className={`${styles.v2_heading}`}>Download App</h3>
          {storeButtons}
        </div>

      </div>

      {/* Mobile Accordion */}
      <div className={styles.v2_mobileFooter}>
        <div className={styles.v2_mobileLogo}>
          <img src={ShubhAstroLogo} alt="ShubhAstro Logo" width="150" height="27" className={styles.v2_logo} />
          <p className={styles.v2_tagline}>ShubhAstro.ai offers AI-powered astrology guidance for love, marriage, career, finance, and life decisions through Kundli, Numerology, Palmistry, Face Reading, Signature Analysis and Vastu.</p>
          <p className={styles.v2_followLabel}>Follow Us</p>
          <div className={styles.v2_socialIcons}>
            <a href="https://www.facebook.com/profile.php?id=61589408862522" aria-label="Facebook" target="_blank" rel="noopener noreferrer"><IoLogoFacebook /></a>
            <a href="https://www.youtube.com/@ShubhAstroofficial" aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            <a href="https://www.instagram.com/shubhastroofficial/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><IoLogoInstagram /></a>
            <a href="https://www.linkedin.com/company/shubhastro-ai" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
            {/* <a href="https://twitter.com" aria-label="X" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a> */}
          </div>
        </div>
        {renderAccordionColumn("horoscope", "Horoscope", horoscopeLinks)}
        {renderAccordionColumn("services", "Explore Services", serviceLinks)}
        {/* {isShubhMallEnabled() && renderAccordionColumn("shop", "Shop Our Products", shopLinks)} */}
        {renderAccordionColumn("company", "Company Policies", companyLinks)}
        {renderAccordionShell(
          "contact",
          "Contact Us",
          <>
            <p className={styles.v2_contactText}>Have questions?</p>
            <a href="mailto:connect@pittiegroup.com" className={styles.v2_emailLink}>connect@pittiegroup.com</a>
            {/* <p className={styles.v2_contactText}>Or call us at</p>
            <a href="tel:+918655682877" className={styles.v2_contactText}>+91 86556 82877</a> */}
            <h4 className={`${styles.v2_phoneLink} `}>Registered Company Address</h4>
            <a
              href={REGISTERED_ADDRESS_MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.v2_contactText} ${styles.v2_addressLink}`}
            >
              {REGISTERED_ADDRESS}
            </a>
            <h4 className={`${styles.v2_phoneLink}`}>Legal Company Name</h4>
            <p className={styles.v2_contactText}>PITTIE GLOBAL PRIVATE LIMITED</p>
          </>,
          { tall: true }
        )}

        {/* Outside the accordion above: collapsing Contact Us must not take the
            store buttons with it, and "Download App" is a CTA rather than a
            reference column, so it stays put. */}
        <div className={`${styles.v2_column} ${styles.v2_marT}`}>
          <h3 className={`${styles.v2_heading} ${styles.v2_heading_sub}`}>Download App</h3>
          {storeButtons}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.v2_bottomOuter}>
        <div className={styles.v2_bottomBar}>
          <p> ©{currentYear} PITTIE GLOBAL Pvt. Ltd. All rights reserved</p>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-and-conditions">T&C</Link></li>
          </ul>
        </div>
      </div>


    </footer>
  );
};

export default Footer;
