import { useState } from "react";
import { useFaqs } from "../hooks/useApiData";
import { useLanguage } from "../i18n/LanguageContext";

export default function FaqSection() {
  const { faqs } = useFaqs();
  const { t } = useLanguage();
  const [openId, setOpenId] = useState(null);

  if (!faqs.length) return null;

  return (
    <div className="faq-section">
      <div className="eyebrow">{t.faq.eyebrow}</div>
      <h2 className="section-title" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{t.faq.title}</h2>
      <div className="faq-list">
        {faqs.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div className={`faq-item${isOpen ? " open" : ""}`} key={item.id}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <span className="faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <div className="faq-answer">{item.answer}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
