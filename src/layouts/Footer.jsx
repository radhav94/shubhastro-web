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

// Data for links - easy to manage and update
const quickLinks = [
  { href: "/talk-to-astrologers", text: "Talk to Astrologer" },
  { href: "/astrologer/chat", text: "Chat with Astrologer" },
  { href: "/astrologer/tarot-reader", text: "Tarot Readers" },
  { href: "/astrologer/vastu", text: "Vastu Experts" },
  { href: "/astrologer/love", text: "Love Astrologer" },
];

const usefulLinks = [
  { href: "/aboutus.aspx", text: "About Us" },
  { href: "/contact-us", text: "Contact Us" },
  { href: "/career.aspx", text: "Careers" },
  { href: "/refund-policy", text: "Refund Policy" },
  { href: "/faqs", text: "FAQs" },
];

const mobileNavLinks = [
  { href: "/", icon: <IoHomeOutline />, text: "Home", active: true }, // Example 'active' state
  { href: "/talk-to-astrologers", icon: <IoCallOutline />, text: "Talk" },
  { href: "/shop", icon: <IoStorefrontOutline />, text: "Mall", new: true },
  { href: "/astrologer-live", icon: <IoPlayCircleOutline />, text: "Live" },
  {
    href: "/registration/login.aspx",
    icon: <IoPersonCircleOutline />,
    text: "Sign In",
  },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
                  <a href={link.href}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.footer_column}>
            <h3 className={styles.column_title}>Useful Links</h3>
            <ul>
              {usefulLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.text}</a>
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
              <a href="/policy.aspx">Privacy Policy</a>
            </li>
            <li>
              <a href="/termandcondition.aspx">T&C</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Sticky Mobile Footer Navigation */}
      <div className={styles.pwa_footer}>
        <nav>
          <ul>
            {mobileNavLinks.map((link) => (
              <li key={link.text}>
                <a
                  href={link.href}
                  className={link.active ? styles.active : ""}
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
    </footer>
  );
};

export default Footer;
