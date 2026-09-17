import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import ProcessTimeline from "../components/ProcessTimeline";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SkeletonGrid } from "../components/Skeleton";
import { useCountUp } from "../hooks/useCountUp";
import { useProjects, useSettings, useTestimonials } from "../hooks/useApiData";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_URL, SITE_NAME, BUSINESS_DESCRIPTION } from "../lib/seoConfig";

const TECH = ["Diskon 30% Website", "Gratis Domain 1 Tahun", "Support 24/7", "Promo Paket Bundling", "Gratis Konsultasi", "Cicilan 0% Tersedia"];

function Stat({ target, suffix, label }) {
  const { ref, display } = useCountUp(target, { suffix });
  return (
    <div className="stat">
      <div className="stat-num" ref={ref}>{display}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { projects } = useProjects();
  const { settings } = useSettings();
  const { testimonials, loading: testimonialsLoading } = useTestimonials();
  const featured = projects.filter((p) => p.featured).slice(0, 3);

  const techStripRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTechIdx, setCurrentTechIdx] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (techStripRef.current) {
        const rect = techStripRef.current.getBoundingClientRect();
        setIsScrolled(rect.top <= 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTechIdx((prev) => (prev + 1) % TECH.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    description: BUSINESS_DESCRIPTION,
    url: SITE_URL,
    areaServed: "ID",
    priceRange: "$$",
    address: { "@type": "PostalAddress", addressCountry: "ID" },
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Jasa Website Murah" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Jasa Landing Page" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Jasa IT Murah" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Jasa Company Profile" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Jasa Toko Online" } }
    ]
  };

  return (
    <>
      <Seo title={t.meta.home.title} description={t.meta.home.desc} jsonLd={jsonLd} />

      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="hero-kicker">{t.home.kicker}</div>
            <h1>{t.home.h1a}<br />{t.home.h1b}<em>{t.home.h1em}</em></h1>
            <p className="hero-desc">{t.home.desc}</p>
            <div className="hero-actions">
              <Link to="/projects" className="btn btn-primary">{t.home.ctaProjects}</Link>
              <Link to="/contact" className="btn btn-ghost">{t.home.ctaTalk}</Link>
            </div>
            <ul className="hero-keywords" aria-label="Layanan">
              {t.home.keywordTags.map((kw) => <li key={kw}>{kw}</li>)}
            </ul>
          </div>
          <div className="hero-meta">
            <div><strong>{t.home.metaBased}</strong>{t.home.metaBasedVal}</div>
            <div><strong>{t.home.metaFocus}</strong>{t.home.metaFocusVal}</div>
            <div><strong>{t.home.metaStack}</strong>{t.home.metaStackVal}</div>
          </div>
        </div>
      </section>

      <div className={`tech-strip${isScrolled ? " sticky" : ""}`} aria-hidden="true" ref={techStripRef}>
        <div className="tech-current">{TECH[currentTechIdx]}</div>
      </div>

      <Reveal>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">{t.home.workEyebrow}</div>
            <h2 className="section-title">{t.home.workTitle}</h2>
            <p className="section-desc">{t.home.workDesc}</p>
          </div>
          <div className="grid-3">
            {featured.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
          </div>
          <div style={{ marginTop: 28 }}>
            <Link to="/projects" className="btn btn-ghost">{t.home.viewAll}</Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">{t.home.doEyebrow}</div>
            <h2 className="section-title">{t.home.doTitle}</h2>
            <p className="section-desc">{t.home.doDesc}</p>
          </div>
          <div className="grid-3">
            <div className="cell">
              <div className="service-index">01</div>
              <div className="service-title">{t.home.s1title}</div>
              <p className="service-desc">{t.home.s1desc}</p>
            </div>
            <div className="cell">
              <div className="service-index">02</div>
              <div className="service-title">{t.home.s2title}</div>
              <p className="service-desc">{t.home.s2desc}</p>
            </div>
            <div className="cell">
              <div className="service-index">03</div>
              <div className="service-title">{t.home.s3title}</div>
              <p className="service-desc">{t.home.s3desc}</p>
            </div>
          </div>
          <div style={{ marginTop: 28 }}>
            <Link to="/services" className="btn btn-ghost">{t.home.seeAllServices}</Link>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="container">
          <div className="stats">
            <Stat target={Number(settings.stats_projects) || 0} suffix="+" label={t.home.statsProjects} />
            <Stat target={Number(settings.stats_clients) || 0} suffix="+" label={t.home.statsClients} />
            <Stat target={Number(settings.stats_years) || 0} suffix="+" label={t.home.statsYears} />
            <Stat target={Number(settings.stats_tech) || 0} suffix="+" label={t.home.statsTech} />
          </div>
        </div>
      </Reveal>

      {(testimonialsLoading || testimonials.length > 0) && (
        <Reveal>
          <div className="container">
            <div className="section-head">
              <div className="eyebrow">{t.home.testimonialsEyebrow}</div>
              <h2 className="section-title">{t.home.testimonialsTitle}</h2>
            </div>
            {testimonialsLoading ? (
              <SkeletonGrid count={3} lines={3} />
            ) : (
            <div className="grid-3">
              {testimonials.slice(0, 6).map((tm) => (
                <div className="testimonial-card" key={tm.id}>
                  <div className="testimonial-rating">{"★".repeat(tm.rating || 5)}{"☆".repeat(5 - (tm.rating || 5))}</div>
                  <p className="testimonial-text">"{tm.review_text}"</p>
                  <div className="testimonial-client">
                    {tm.photo_url ? (
                      <img className="testimonial-avatar" src={tm.photo_url} alt={tm.client_name} />
                    ) : (
                      <div className="testimonial-avatar testimonial-avatar-fallback">{tm.client_name.charAt(0)}</div>
                    )}
                    <div>
                      <div className="testimonial-name">{tm.client_name}</div>
                      <div className="testimonial-role">{[tm.client_position, tm.client_company].filter(Boolean).join(" · ")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        </Reveal>
      )}

      <Reveal>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">{t.home.howEyebrow}</div>
            <h2 className="section-title">{t.home.howTitle}</h2>
            <p className="section-desc">{t.home.howDesc}</p>
          </div>
          <ProcessTimeline />
        </div>
      </Reveal>

      <Reveal as="section" className="cta-band">
        <div className="container">
          <h2>{t.home.ctaBandTitle1}<br />{t.home.ctaBandTitle2}</h2>
          <Link to="/contact" className="btn btn-primary">{t.home.ctaBandBtn}</Link>
        </div>
      </Reveal>
    </>
  );
}
