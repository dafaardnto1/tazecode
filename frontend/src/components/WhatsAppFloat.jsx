import { useSettings } from "../hooks/useApiData";
import { useLanguage } from "../i18n/LanguageContext";

export default function WhatsAppFloat() {
  const { settings } = useSettings();
  const { lang } = useLanguage();
  const number = settings.contact_whatsapp;
  if (!number) return null;

  const message = lang === "id"
    ? "Halo TAZECODE, saya mau tanya-tanya soal jasa website."
    : "Hi TAZECODE, I'd like to ask about your web services.";

  return (
    <a
      className="whatsapp-float"
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
    >
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.15c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.61-.6-2.84-1.23-4.7-4.1-4.84-4.29-.14-.19-1.15-1.53-1.15-2.92s.72-2.07.98-2.35c.25-.28.55-.35.74-.35.19 0 .37.002.53.01.17.007.4-.065.62.47.24.58.81 1.99.88 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.47-.14.17-.3.37-.42.5-.14.15-.29.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.14.46.12.63-.07.17-.19.72-.84.91-1.13.19-.29.38-.24.63-.15.26.1 1.65.78 1.93.92.29.14.48.22.55.34.07.13.07.72-.17 1.4z"/>
      </svg>
    </a>
  );
}
