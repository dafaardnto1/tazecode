import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const LANG_KEY = "tazecode-lang";
const LanguageContext = createContext(null);

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "id" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  // Default to Indonesian — primary market & SEO target language.
  return "id";
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === "id" ? "en" : "id")),
      t: translations[lang]
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
