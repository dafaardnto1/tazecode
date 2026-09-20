import { Link } from "react-router-dom";
import FaqSection from "../components/FaqSection";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SkeletonGrid } from "../components/Skeleton";
import { useLanguage } from "../i18n/LanguageContext";
import { usePricing, useSettings } from "../hooks/useApiData";
import { useAutoTranslate } from "../hooks/useAutoTranslate";

function formatPrice(price) {
  const num = Number(price);
  if (!num || Number.isNaN(num)) return price;
  return "Rp " + num.toLocaleString("id-ID");
}

export default function Pricelist() {
  const { t } = useLanguage();
  const p = t.pricelist;
  const { pricing, loading } = usePricing();
  const { settings } = useSettings();
  const page = useAutoTranslate({
    eyebrow: settings.page_pricing_eyebrow,
    title: settings.page_pricing_title,
    desc: settings.page_pricing_desc,
    note: settings.page_pricing_note
  });
  const pageEyebrow = page.eyebrow || p.eyebrow;
  const pageTitle = page.title || p.title;
  const pageDesc = page.desc || p.desc;
  const pageNote = page.note || p.note;

  return (
    <>
      <Seo title={t.meta.pricelist.title} description={t.meta.pricelist.desc} />

      <section style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="eyebrow">{pageEyebrow}</div>
          <h1 className="section-title">{pageTitle}</h1>
          <p className="section-desc" style={{ marginTop: 14 }}>{pageDesc}</p>
        </div>
      </section>

      <Reveal>
        <div className="container">
          {loading ? (
            <SkeletonGrid count={4} lines={4} />
          ) : (
            <>
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
              <p className="price-note">{pageNote}</p>
            </>
          )}
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
