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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

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

const Footer = () => {
  const navigate = useNavigate();
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
  // Mobile Bottom Nav
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
      {/* your full footer UI unchanged */}
      {/* ... */}
    </footer>
  );
};


export default Footer;
