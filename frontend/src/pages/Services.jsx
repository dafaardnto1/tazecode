import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SkeletonGrid } from "../components/Skeleton";
import { useServices, useSettings } from "../hooks/useApiData";
import { useAutoTranslate } from "../hooks/useAutoTranslate";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_URL, SITE_NAME } from "../lib/seoConfig";

export default function Services() {
  const { t } = useLanguage();
  const s = t.services;
  const staticItems = s.items.map((item) => ({ title: item.title, description: item.desc, features: item.features }));
  const { services: items, loading } = useServices(staticItems);
  const { settings } = useSettings();
  const page = useAutoTranslate({
    eyebrow: settings.page_services_eyebrow,
    title: settings.page_services_title,
    desc: settings.page_services_desc
  });
  const pageEyebrow = page.eyebrow || s.eyebrow;
  const pageTitle = page.title || s.title;
  const pageDesc = page.desc || s.desc;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Web Development",
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: "ID",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Layanan TAZECODE",
      itemListElement: items.map((item) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: item.title, description: item.description }
      }))
    }
  };

  return (
    <>
      <Seo title={t.meta.services.title} description={t.meta.services.desc} jsonLd={jsonLd} />

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
            <SkeletonGrid count={6} lines={3} />
          ) : (
            <div className="auto-grid">
              {items.map((item, i) => (
                <div className="service-card" key={item.id || item.title}>
                  <div className="service-index">{String(i + 1).padStart(2, "0")}</div>
                  <div className="service-title">{item.title}</div>
                  <p className="service-desc">{item.description}</p>
                  <ul className="service-features">
                    {(item.features || []).map((f) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">{s.processEyebrow}</div>
            <h2 className="section-title">{s.processTitle}</h2>
          </div>
          <div className="timeline">
            {s.process.map(([num, title, desc]) => (
              <div className="timeline-item" key={num}>
                <div className="timeline-year">{num}</div>
                <div><div className="timeline-role">{title}</div><p className="timeline-desc">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="cta-band">
        <div className="container">
          <h2>{s.ctaTitle}</h2>
          <Link to="/contact" className="btn btn-primary">{s.ctaBtn}</Link>
        </div>
      </Reveal>
    </>
  );
}
