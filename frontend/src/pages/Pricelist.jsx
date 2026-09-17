import { Link } from "react-router-dom";
import FaqSection from "../components/FaqSection";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { useLanguage } from "../i18n/LanguageContext";
import { usePricing } from "../hooks/useApiData";

function formatPrice(price) {
  const num = Number(price);
  if (!num || Number.isNaN(num)) return price;
  return "Rp " + num.toLocaleString("id-ID");
}

export default function Pricelist() {
  const { t } = useLanguage();
  const p = t.pricelist;
  const { pricing } = usePricing();

  return (
    <>
      <Seo title={t.meta.pricelist.title} description={t.meta.pricelist.desc} />

      <section style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="eyebrow">{p.eyebrow}</div>
          <h1 className="section-title">{p.title}</h1>
          <p className="section-desc" style={{ marginTop: 14 }}>{p.desc}</p>
        </div>
      </section>

      <Reveal>
        <div className="container">
          <div className="pricing-grid">
            {pricing.map((plan) => (
              <div className={`price-card${plan.is_popular ? " popular" : ""}`} key={plan.id}>
                {plan.is_popular && <div className="price-badge">{p.popularBadge}</div>}
                <div className="price-name">{plan.name}</div>
                <div className="price-amount">
                  {plan.price_suffix && <span className="price-suffix">{plan.price_suffix}</span>}
                  <span className="price-num">{formatPrice(plan.price)}</span>
                </div>
                <p className="price-desc">{plan.description}</p>
                <ul className="price-features">
                  {(plan.features || []).map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link to="/contact" className={`btn ${plan.is_popular ? "btn-primary" : "btn-ghost"}`} style={{ justifyContent: "center", width: "100%" }}>
                  {p.ctaBtn}
                </Link>
              </div>
            ))}
          </div>
          <p className="price-note">{p.note}</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="container">
          <FaqSection />
        </div>
      </Reveal>

      <Reveal as="section" className="cta-band">
        <div className="container">
          <h2>{p.ctaTitle}</h2>
          <Link to="/contact" className="btn btn-primary">{p.ctaBandBtn}</Link>
        </div>
      </Reveal>
    </>
  );
}
