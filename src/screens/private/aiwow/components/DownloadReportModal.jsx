import { useState } from "react";
import styles from "./DownloadReportModal.module.scss";

const DEFAULT_LANGUAGES = [
  { id: "en", label: "English", sub: "English" },
  { id: "hi", label: "Hindi", sub: "हिंदी" },
  { id: "ta", label: "Tamil", sub: "" },
  { id: "te", label: "Telugu", sub: "" },
  { id: "bn", label: "Bengali", sub: "" },
  { id: "mr", label: "Marathi", sub: "मराठी" },
];

const DownloadReportModal = ({
  isOpen,
  onClose,
  onDownload,
  featureName = "AI Report",
  downloadCost = 0,
  walletBalance = 0,
  isDownloading = false,
  languages,
  generatedLanguages,
  showLanguageSelection = true,
}) => {
  const [selectedLang, setSelectedLang] = useState("en");

  const langList = languages || DEFAULT_LANGUAGES;

  if (!isOpen) return null;

  // Check if selected language is already generated (free)
  const isLangFree = generatedLanguages && selectedLang in generatedLanguages && !!generatedLanguages[selectedLang];
  const isFreeDownload = isLangFree || downloadCost === 0;
  const effectiveCost = isFreeDownload ? 0 : downloadCost;
  const isLoadingCost = downloadCost === null || downloadCost === undefined;

  const canAfford = isFreeDownload || isLoadingCost || walletBalance >= downloadCost;
  const deductionText = isFreeDownload
    ? "Already generated — Free download"
    : isLoadingCost
      ? "Loading price..."
      : canAfford
        ? `₹${downloadCost} will be deducted from your wallet`
        : `Insufficient balance. Please recharge ₹${downloadCost - walletBalance} more`;

  const handleDownload = () => {
    if (!canAfford || isDownloading || isLoadingCost) return;
    onDownload(selectedLang);
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.downloadIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 16L7 11H10V4H14V11H17L12 16Z" />
                <path d="M5 20H19V18H5V20Z" />
              </svg>
            </div>
            <div>
              <span className={styles.paidBadge}>✦ PAID</span>
              <h3 className={styles.headerTitle}>Premium Feature</h3>
              <p className={styles.headerSub}>Download {featureName}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Cost & Balance */}
        <div className={styles.costSection}>
          <div className={styles.costRow}>
            <div>
              <span className={styles.costLabel}>Download Cost</span>
              <span className={styles.costValue}>{isFreeDownload ? "Free" : isLoadingCost ? "Loading..." : `₹${downloadCost}`}</span>
            </div>
            <div className={styles.balanceBlock}>
              <span className={styles.costLabel}>Your Balance</span>
              <span className={styles.balanceValue}>₹{walletBalance?.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div className={`${styles.deductionMsg} ${!canAfford ? styles.insufficient : ""}`}>
            {canAfford ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#dc2626"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            )}
            <span>{deductionText}</span>
          </div>
        </div>

        {/* Language Selection */}
        {showLanguageSelection && (
        <div className={styles.langSection}>
          <h4 className={styles.langTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>
            Select Language
          </h4>
          <div className={styles.langGrid}>
            {langList.map((lang) => {
              const isFree = generatedLanguages && lang.id in generatedLanguages && !!generatedLanguages[lang.id];
              return (
              <button
                key={lang.id}
                className={`${styles.langCard} ${selectedLang === lang.id ? styles.langActive : ""}`}
                onClick={() => setSelectedLang(lang.id)}
              >
                <span className={styles.langLabel}>{lang.label}</span>
                {lang.sub && <span className={styles.langSub}>{lang.sub}</span>}
                {isFree && <span className={styles.freeBadge}>FREE</span>}
                {selectedLang === lang.id && (
                  <span className={styles.langCheck}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  </span>
                )}
              </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Footer Buttons */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={`${styles.downloadBtn} ${(!canAfford || isDownloading) ? styles.disabledBtn : ""}`}
            onClick={handleDownload}
            disabled={!canAfford || isDownloading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 16L7 11H10V4H14V11H17L12 16Z" />
              <path d="M5 20H19V18H5V20Z" />
            </svg>
            {isDownloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadReportModal;
