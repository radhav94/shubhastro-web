import { useState, useEffect, useRef } from "react";
import styles from "./LanguageSelector.module.scss";

const supportedLanguages = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "kn", name: "Kannada" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "ar", name: "Arabic" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ms", name: "Malay" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "pl", name: "Polish" },
  { code: "es", name: "Spanish" },
  { code: "sv", name: "Swedish" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
];

const LanguageSelector = ({ style, className }) => {
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [activeLang, setActiveLang] = useState("English");
  const langRef = useRef(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    if (langOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [langOpen]);

  // Sync selected language with Google Translate cookie
  useEffect(() => {
    const getCurrentLang = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    };

    const currentLangCode = getCurrentLang();
    setSelectedLang(currentLangCode);

    const currentLang = supportedLanguages.find(
      (lang) => lang.code === currentLangCode
    );
    if (currentLang) {
      setActiveLang(currentLang.name);
    }
  }, []);

  const handleLanguageChange = (targetLang) => {
    const getCurrentLang = () => {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("googtrans="));
      if (cookie) {
        const value = decodeURIComponent(cookie.split("=")[1]);
        const parts = value.split("/");
        return parts[2] || "en";
      }
      return "en";
    };

    const clearCookies = () => {
      const hostname = window.location.hostname;
      const cookiesToClear = ["googtrans", "googtrans_backup"];
      const domainParts = hostname.split(".");
      const domains = [""];
      domains.push(`domain=${hostname}`);
      if (domainParts.length > 1) {
        domains.push(`domain=.${hostname}`);
        if (domainParts.length > 2) {
          const parentDomain = domainParts.slice(-2).join(".");
          domains.push(`domain=.${parentDomain}`);
        }
      }
      cookiesToClear.forEach((cookieName) => {
        domains.forEach((domainStr) => {
          ["/", ""].forEach((path) => {
            const pathStr = path ? `path=${path};` : "";
            const domainPart = domainStr ? `${domainStr};` : "";
            document.cookie = `${cookieName}=; ${pathStr} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
          });
        });
      });
    };

    const setCookie = (lang) => {
      const hostname = window.location.hostname;
      const cookieValue = `/en/${lang}`;
      const maxAge = 31536000;
      document.cookie = `googtrans=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax;`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${hostname}; max-age=${maxAge}; SameSite=Lax;`;
      const domainParts = hostname.split(".");
      if (domainParts.length > 1) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${hostname}; max-age=${maxAge}; SameSite=Lax;`;
        if (domainParts.length > 2) {
          const parentDomain = domainParts.slice(-2).join(".");
          document.cookie = `googtrans=${cookieValue}; path=/; domain=.${parentDomain}; max-age=${maxAge}; SameSite=Lax;`;
        }
      }
    };

    const currentLang = getCurrentLang();
    if (currentLang === targetLang) {
      setLangOpen(false);
      return;
    }

    setSelectedLang(targetLang);
    const selectedLanguage = supportedLanguages.find(
      (lang) => lang.code === targetLang
    );
    if (selectedLanguage) {
      setActiveLang(selectedLanguage.name);
    }
    setLangOpen(false);

    window.dispatchEvent(
      new CustomEvent("translationchange", { detail: { lang: targetLang } })
    );

    if (targetLang === "en") {
      clearCookies();
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return;
    }

    const widget = document.querySelector(".goog-te-combo");
    if (widget) {
      widget.value = targetLang;
      widget.dispatchEvent(new Event("change"));
      setCookie(targetLang);
      return;
    }

    clearCookies();
    setTimeout(() => {
      setCookie(targetLang);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }, 100);
  };

  return (
    <div
      className={`${styles.langWrap} ${className || ""}`}
      style={style}
      ref={langRef}
    >
      <span
        className={styles.langToggle}
        onClick={() => setLangOpen((prev) => !prev)}
      >
        <span className={styles.langName}>{activeLang}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="6"
          viewBox="0 0 14 8"
          fill="none"
        >
          <path
            d="M2.08049 0.355353L6.79423 5.0691L11.508 0.355353C11.9818 -0.118451 12.7472 -0.118451 13.221 0.355353C13.6948 0.829157 13.6948 1.59453 13.221 2.06834L7.64465 7.64465C7.17084 8.11845 6.40547 8.11845 5.93166 7.64465L0.355353 2.06834C-0.118451 1.59453 -0.118451 0.829157 0.355353 0.355353C0.829157 -0.106302 1.60668 -0.118451 2.08049 0.355353Z"
            fill="url(#paint0_linear_lang_selector)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_lang_selector"
              x1="0"
              y1="4"
              x2="13.5763"
              y2="4"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F75801" />
              <stop offset="1" stopColor="#D43400" />
            </linearGradient>
          </defs>
        </svg>
      </span>

      <div
        className={`${styles.langDropdown} ${
          langOpen ? styles.langOpen : styles.langClose
        } notranslate`}
        translate="no"
      >
        {supportedLanguages.map((lang) => (
          <p
            key={lang.code}
            className={`notranslate ${
              lang.code === selectedLang ? styles.langActive : ""
            }`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.name}
            {lang.code === selectedLang && <span>✓</span>}
          </p>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
