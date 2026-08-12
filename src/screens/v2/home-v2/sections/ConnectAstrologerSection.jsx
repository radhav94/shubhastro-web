import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import avatar1 from "../../../../assets/images/community-avatar-1.png";
import avatar2 from "../../../../assets/images/community-avatar-2.png";
import avatar3 from "../../../../assets/images/community-avatar-3.png";
import avatar4 from "../../../../assets/images/community-avatar-4.png";
import profilsImg from "../../../../assets/images/profilsImg.png";

const CTA_AVATARS = [avatar1, avatar2, avatar3, avatar4];

const DEFAULT_TRUST_LABELS = ["100% Secure", "Verified Experts", "Privacy Protected"];

const TrustIcons = [
  // Lock
  <svg key="lock" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM9 8V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9Z" fill="url(#lock_grad)" />
    <defs><linearGradient id="lock_grad" x1="4" y1="11.5" x2="20" y2="11.5" gradientUnits="userSpaceOnUse"><stop stopColor="#F75801" /><stop offset="1" stopColor="#D43400" /></linearGradient></defs>
  </svg>,
  // Verified
  <svg key="verified" xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 22 21" fill="none">
    <path d="M22 10.5L19.56 7.71L19.9 4.02L16.29 3.2L14.4 0L11 1.46L7.6 0L5.71 3.19L2.1 4L2.44 7.7L0 10.5L2.44 13.29L2.1 16.99L5.71 17.81L7.6 21L11 19.53L14.4 20.99L16.29 17.8L19.9 16.98L19.56 13.29L22 10.5ZM8.38 14.51L6 12.11C5.61 11.72 5.61 11.09 6 10.7L6.07 10.63C6.46 10.24 7.1 10.24 7.49 10.63L9.1 12.25L14.25 7.09C14.64 6.7 15.28 6.7 15.67 7.09L15.74 7.16C16.13 7.55 16.13 8.18 15.74 8.57L9.82 14.51C9.41 14.9 8.78 14.9 8.38 14.51Z" fill="url(#verified_grad)" />
    <defs><linearGradient id="verified_grad" x1="0" y1="10.5" x2="22" y2="10.5" gradientUnits="userSpaceOnUse"><stop stopColor="#F75801" /><stop offset="1" stopColor="#D43400" /></linearGradient></defs>
  </svg>,
  // Shield
  <svg key="shield" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M11.3 2.26007L5.3 4.51007C4.52 4.81007 4 5.55007 4 6.39007V11.0901C4 15.9201 7.13 20.4601 11.43 21.8401C11.8 21.9601 12.2 21.9601 12.57 21.8401C16.87 20.4601 20 15.9301 20 11.0901V6.39007C20 5.56007 19.48 4.81007 18.7 4.52007L12.7 2.27007C12.25 2.09007 11.75 2.09007 11.3 2.26007Z" fill="url(#shield_grad)" />
    <defs><linearGradient id="shield_grad" x1="4" y1="12.0319" x2="20" y2="12.0319" gradientUnits="userSpaceOnUse"><stop stopColor="#F75801" /><stop offset="1" stopColor="#D43400" /></linearGradient></defs>
  </svg>,
];

const ConnectAstrologerSection = memo(({ sectionData, styles }) => {
  const navigate = useNavigate();

  const handleNavigate = useCallback(() => {
    navigate("/astrologers");
  }, [navigate]);

  const trustLabels = sectionData?.tag_label || DEFAULT_TRUST_LABELS;

  return (
    <div className={styles.ctaBanner}>
      <div className={styles.ctaLeft}>
        {/* <div className={styles.ctaTag}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#f75801">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          {sectionData?.quick_message || "Don't Wait. Get Clarity Now."}
        </div> */}
        <h3 className={styles.ctaHeading}>
          {sectionData?.display_title || sectionData?.title || "Talk to an Astrologer"}
        </h3>
        <p className={styles.ctaOrange}>{sectionData?.sub_title || "Get Clarity on What Matter Most!"}</p>
        <p className={styles.ctaDesc}>
          {sectionData?.description || "Connect with verified astrologers and get guidance on love, career, health, finance and more."}
        </p>
        <div className={styles.ctaAvatarRow}>
          <div className={styles.ctaAvatars}>
            {/* {CTA_AVATARS.map((av, i) => (
              <img key={i} src={av} alt="" className={styles.ctaAvatar} loading="lazy" />
            ))}
            <span className={styles.ctaAvatarCount}>50+</span> */}
            {/* Intrinsic size of profilsImg.png (359x103). The CSS sizes this
                with `height: 65px; width: auto`, so without these attributes
                the browser has no aspect ratio to work from and reserves zero
                width until the bytes arrive — then the row snaps to ~227px
                wide and shoves the "50+ ... Online" label sideways. With them
                the aspect ratio is known up front and the space is reserved. */}
            <img
              src={profilsImg}
              alt=""
              className={styles.ctaAvatar}
              width="359"
              height="103"
              loading="lazy"
            />
          </div>
          <span className={styles.ctaOnline}>
            <span className={styles.ctaOnlineDot} />
            50+ Expert Astrologers Online
          </span>
        </div>
      </div>

      <div className={styles.ctaRight}>
        <button className={styles.ctaBtnPrimary} onClick={handleNavigate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M10.625 23.75H10C5 23.75 2.5 22.5 2.5 16.25V10C2.5 5 5 2.5 10 2.5H20C25 2.5 27.5 5 27.5 10V16.25C27.5 21.25 25 23.75 20 23.75H19.375C18.9875 23.75 18.6125 23.9375 18.375 24.25L16.5 26.75C15.675 27.85 14.325 27.85 13.5 26.75L11.625 24.25C11.425 23.975 10.9625 23.75 10.625 23.75Z" stroke="#FEFEFE" strokeWidth="1.8" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.75 10H21.25" stroke="#FEFEFE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.75 16.25H16.25" stroke="#FEFEFE" strokeWidth="1.77938" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {sectionData?.action_btn?.[0] || "Start Chat Consultation"}
        </button>
        <button className={styles.ctaBtnSecondary} onClick={handleNavigate}>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path d="M27.4625 22.9125C27.4625 23.3625 27.3625 23.825 27.15 24.275C26.9375 24.725 26.6625 25.15 26.3 25.55C25.6875 26.225 25.0125 26.7125 24.25 27.025C23.5 27.3375 22.6875 27.5 21.8125 27.5C20.5375 27.5 19.175 27.2 17.7375 26.5875C16.3 25.975 14.8625 25.15 13.4375 24.1125C12 23.0625 10.6375 21.9 9.3375 20.6125C8.05 19.3125 6.8875 17.95 5.85 16.525C4.825 15.1 4 13.675 3.4 12.2625C2.8 10.8375 2.5 9.475 2.5 8.175C2.5 7.325 2.65 6.5125 2.95 5.7625C3.25 5 3.725 4.3 4.3875 3.675C5.1875 2.8875 6.0625 2.5 6.9875 2.5C7.3375 2.5 7.6875 2.575 8 2.725C8.325 2.875 8.6125 3.1 8.8375 3.425L11.7375 7.5125C11.9625 7.825 12.125 8.1125 12.2375 8.3875C12.35 8.65 12.4125 8.9125 12.4125 9.15C12.4125 9.45 12.325 9.75 12.15 10.0375C11.9875 10.325 11.75 10.625 11.45 10.925L10.5 11.9125C10.3625 12.05 10.3 12.2125 10.3 12.4125C10.3 12.5125 10.3125 12.6 10.3375 12.7C10.375 12.8 10.4125 12.875 10.4375 12.95C10.6625 13.3625 11.05 13.9 11.6 14.55C12.1625 15.2 12.7625 15.8625 13.4125 16.525C14.0875 17.1875 14.7375 17.8 15.4 18.3625C16.05 18.9125 16.5875 19.2875 17.0125 19.5125C17.075 19.5375 17.15 19.575 17.2375 19.6125C17.3375 19.65 17.4375 19.6625 17.55 19.6625C17.7625 19.6625 17.925 19.5875 18.0625 19.45L19.0125 18.5125C19.325 18.2 19.625 17.9625 19.9125 17.8125C20.2 17.6375 20.4875 17.55 20.8 17.55C21.0375 17.55 21.2875 17.6 21.5625 17.7125C21.8375 17.825 22.125 17.9875 22.4375 18.2L26.575 21.1375C26.9 21.3625 27.125 21.625 27.2625 21.9375C27.3875 22.25 27.4625 22.5625 27.4625 22.9125Z" stroke="url(#cta_phone_grad)" strokeWidth="1.8" strokeMiterlimit="10" />
            <path d="M19.375 7.5H25.625" stroke="url(#cta_plus_h)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22.5 10.625V4.375" stroke="url(#cta_plus_v)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="cta_phone_grad" x1="2.5" y1="15" x2="27.4625" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#F75801" /><stop offset="1" stopColor="#D43400" /></linearGradient>
              <linearGradient id="cta_plus_h" x1="19.375" y1="8" x2="25.625" y2="8" gradientUnits="userSpaceOnUse"><stop stopColor="#F75801" /><stop offset="1" stopColor="#D43400" /></linearGradient>
              <linearGradient id="cta_plus_v" x1="22.5" y1="7.5" x2="23.5" y2="7.5" gradientUnits="userSpaceOnUse"><stop stopColor="#F75801" /><stop offset="1" stopColor="#D43400" /></linearGradient>
            </defs>
          </svg>
          {sectionData?.action_btn?.[1] || "Connect with Astrologer"}
        </button>
        <div className={styles.ctaTrust}>
          {trustLabels.map((label, i) => (
            <span key={label} className={styles.ctaTrustItem}>
              {TrustIcons[i % TrustIcons.length]}
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

ConnectAstrologerSection.displayName = "ConnectAstrologerSection";

export default ConnectAstrologerSection;
