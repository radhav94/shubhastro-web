import { useState, useEffect } from "react";
import { getCurrentLang } from "../VedicParams.js/vedicParams";

/**
 * Hook that returns current language and re-renders the component
 * when language changes via the LanguageSelector's `translationchange` event.
 */
const useLang = () => {
  const [lang, setLang] = useState(getCurrentLang);

  useEffect(() => {
    const handleLangChange = (e) => {
      const newLang = e.detail?.lang || getCurrentLang();
      setLang(newLang);
    };
    window.addEventListener("translationchange", handleLangChange);
    return () => window.removeEventListener("translationchange", handleLangChange);
  }, []);

  return lang;
};

export default useLang;
