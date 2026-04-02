"use client";

import { useState, useRef, useEffect } from "react";
import { useI18n, LOCALE_LABELS, LOCALE_FLAGS, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const locales = Object.keys(LOCALE_LABELS) as Locale[];

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 9999 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.45rem 0.75rem",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.85)",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 500,
          transition: "all 0.2s",
          backdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
          (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
          (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
        }}
        title="Change language"
      >
        <span style={{ fontSize: "1rem" }}>{LOCALE_FLAGS[locale]}</span>
        <span>{locale.toUpperCase()}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            background: "rgba(13, 17, 23, 0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            overflow: "hidden",
            minWidth: "150px",
            animation: "fadeInDown 0.15s ease-out",
          }}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => { setLocale(loc); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                width: "100%",
                padding: "0.6rem 0.85rem",
                border: "none",
                background: locale === loc ? "rgba(59, 246, 59, 0.1)" : "transparent",
                color: locale === loc ? "#3bf63b" : "rgba(255,255,255,0.75)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: locale === loc ? 600 : 400,
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (locale !== loc) {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = locale === loc ? "rgba(59, 246, 59, 0.1)" : "transparent";
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>{LOCALE_FLAGS[loc]}</span>
              <span>{LOCALE_LABELS[loc]}</span>
              {locale === loc && (
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#3bf63b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ marginLeft: "auto" }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
