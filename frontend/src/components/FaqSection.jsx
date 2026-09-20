import { useState } from "react";
import { SkeletonBlock } from "./Skeleton";
import { useFaqs } from "../hooks/useApiData";
import { useLanguage } from "../i18n/LanguageContext";

export default function FaqSection() {
  const { faqs, loading } = useFaqs();
  const { t } = useLanguage();
  const [openId, setOpenId] = useState(null);

  if (!loading && !faqs.length) return null;

  return (
    <div className="faq-section">
      <div className="eyebrow">{t.faq.eyebrow}</div>
      <h2 className="section-title" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{t.faq.title}</h2>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
          {[1, 2, 3].map((i) => <SkeletonBlock key={i} width="100%" height={54} />)}
        </div>
      ) : (
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
      )}
    </div>
  );
}
