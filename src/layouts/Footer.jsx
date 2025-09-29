import React from "react";
import styles from "./Footer.module.scss";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.pwa_footer}>
        <ul className={styles.pwa_footer_icon}>
          <li>
            <a href="/">
              <div className={styles.sticky_footer_css}>
                <img
                  loading="lazy"
                  alt="home"
                  src="https://images.astroyogi.com/astroyogi/footer/home_light.png"
                />
              </div>
              Home
            </a>
          </li>
          <li>
            <a href="/talk-to-astrologers">
              <div className={styles.sticky_footer_css}>
                <img
                  loading="lazy"
                  alt="call chat"
                  src="https://images.astroyogi.com/astroyogi/footer/call_chat_dark.png"
                />
              </div>
              Call/Chat
            </a>
          </li>
          <li>
            <a href="/shop">
              <div className={styles.sticky_footer_css}>
                <span className={styles.new_mobile}>New</span>
                <img
                  loading="lazy"
                  alt="yogi mall"
                  src="https://images.astroyogi.com/astroyogi/footer/yogi_mall_dark.png"
                />
              </div>
              Yogii Mall
            </a>
          </li>
          <li>
            <a href="/astrologer-live">
              <div className={styles.sticky_footer_css}>
                <img
                  loading="lazy"
                  alt="live show"
                  src="https://images.astroyogi.com/astroyogi/footer/live_light.png"
                />
              </div>
              Yogi Live
            </a>
          </li>
          <li>
            <a href="/registration/login.aspx">
              <div className={styles.sticky_footer_css}>
                <img
                  loading="lazy"
                  alt="my account"
                  src="https://images.astroyogi.com/astroyogi/footer/account_light.png"
                />
              </div>
              Sign In
            </a>
          </li>
        </ul>
      </div>

      <div className={styles.footer_container}>
        <div className={styles.footer_box}>
          <div className={styles.footer_logo}>
            <img
              alt="Astroyogi"
              src="https://images.astroyogi.com/astroyogi2017/cms/logo.webp"
              loading="lazy"
            />
          </div>
        </div>

        <div className={styles.footer_box}>
          <div className={styles.footer_normal}>Quick Links</div>
          <ul>
            <li>
              <a href="/astrologer/chat">Chat with Astrologer</a>
            </li>
            <li>
              <a href="/talk-to-astrologers">Astrologer</a>
            </li>
            <li>
              <a href="/astrologer/tarot-reader">Tarot Readers</a>
            </li>
            <li>
              <a href="/astrologer/vastu">Vastu Experts</a>
            </li>
            <li>
              <a href="/astrologer/love">Love Astrologer</a>
            </li>
          </ul>
        </div>

        <div className={styles.footer_box}>
          <div className={styles.footer_normal}>Useful Links</div>
          <ul>
            <li>
              <a href="/aboutus.aspx">About Us</a>
            </li>
            <li>
              <a href="/contact-us">Contact Us</a>
            </li>
            <li>
              <a href="/career.aspx">Career</a>
            </li>
            <li>
              <a href="/refund-policy">Refund Policy</a>
            </li>
          </ul>
        </div>
      </div>

      {/* 📌 Bottom Section */}
      <div className={styles.footer_bottom}>
        <div>© Netway India Pvt. Ltd. 2001-2025. All rights reserved</div>
        <ul>
          <li>
            <a href="/policy.aspx">Privacy Policy</a>
          </li>
          <li>
            <a href="/faqs">FAQs</a>
          </li>
          <li>
            <a href="/termandcondition.aspx">T&C</a>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
