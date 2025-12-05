import React from "react";
import "./SharePopup.scss";
import { AppIcons } from "../../../../../utils/appImages";

const SharePopup = ({
  show,
  onClose,
  url,
  shareToWhatsapp,
  shareToGmail,
  handleCopyLink,
}) => {
  if (!show) return null;

  const iconMap = {
    gmail: AppIcons.Gmail,
    whatsapp: AppIcons.whatsapp,
    copyLink: AppIcons.CopyLink,
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-popup" onClick={(e) => e.stopPropagation()}>
        <div className="share-title">Sharing Live</div>
        <div className="share-message">Watch Live now 👉 {url}</div>

        <div className="share-apps">
          <button className="share-app-btn" onClick={shareToWhatsapp}>
            <img
              src={iconMap["whatsapp"]}
              alt="WhatsApp"
              className="app-icon-img"
            />
            <span className="app-name">WhatsApp</span>
          </button>

          <button className="share-app-btn" onClick={shareToGmail}>
            <img src={iconMap["gmail"]} alt="Gmail" className="app-icon-img" />
            <span className="app-name">Gmail</span>
          </button>

          <button className="share-app-btn" onClick={handleCopyLink}>
            <img
              src={AppIcons.CopyLink}
              alt="Copy Link"
              className="app-icon-img"
            />
            <span className="app-name">Copy Link</span>
          </button>
        </div>

        <button className="share-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SharePopup;
