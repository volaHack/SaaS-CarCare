"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import es, { type TranslationKeys } from "./es";
import en from "./en";
import fr from "./fr";

export type Locale = "es" | "en" | "fr";

const locales: Record<Locale, TranslationKeys> = { es, en, fr };

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "carcare_locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in locales) return stored as Locale;
  // Detect browser language
  const browserLang = navigator.language.slice(0, 2);
  if (browserLang in locales) return browserLang as Locale;
  return "es";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getInitialLocale());
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: locales[locale],
  };

  // Avoid hydration mismatch — render with default locale on server
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: "es", setLocale, t: es }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function useTranslation() {
  const { t } = useI18n();
  return t;
}
