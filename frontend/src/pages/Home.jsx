import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import ProcessTimeline from "../components/ProcessTimeline";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SkeletonBlock, SkeletonGrid } from "../components/Skeleton";
import ServicesCarousel from "../components/ServicesCarousel";
import { useCountUp } from "../hooks/useCountUp";
import { useProjects, useServices, useSettings, useTestimonials } from "../hooks/useApiData";
import { useAutoTranslate } from "../hooks/useAutoTranslate";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_URL, SITE_NAME, BUSINESS_DESCRIPTION } from "../lib/seoConfig";

const DEFAULT_TECH = ["Diskon 30% Website", "Gratis Domain 1 Tahun", "Support 24/7", "Promo Paket Bundling", "Gratis Konsultasi", "Cicilan 0% Tersedia"];

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
  const { projects, loading: projectsLoading } = useProjects();
  const { settings, loading: settingsLoading } = useSettings();
  const { testimonials, loading: testimonialsLoading } = useTestimonials();
  const featured = projects.filter((p) => p.featured).slice(0, 3);

  const staticServiceItems = t.services.items.map((item) => ({ title: item.title, description: item.desc, features: item.features }));
  const { services, loading: servicesLoading } = useServices(staticServiceItems);
  const serviceCarouselItems = services.map((item, i) => ({
    i: String(i + 1).padStart(2, "0"),
    title: item.title,
    desc: item.description
  }));

  const heroOverridesRaw = {
    kicker: settings.hero_kicker,
    h1a: settings.hero_title_line1,
    h1b: settings.hero_title_line2,
    h1em: settings.hero_title_highlight,
    desc: settings.hero_desc,
    ctaPrimary: settings.hero_cta_primary,
    ctaSecondary: settings.hero_cta_secondary,
    keywords: settings.hero_keywords ? settings.hero_keywords.split(",").map((s) => s.trim()).filter(Boolean) : null,
    promo: settings.hero_promo_text ? settings.hero_promo_text.split(",").map((s) => s.trim()).filter(Boolean) : null
  };
  const hero = useAutoTranslate(heroOverridesRaw);

  const heroKicker = hero.kicker || t.home.kicker;
  const heroH1a = hero.h1a || t.home.h1a;
  const heroH1b = hero.h1b || t.home.h1b;
  const heroH1em = hero.h1em || t.home.h1em;
  const heroDesc = hero.desc || t.home.desc;
  const heroCtaPrimary = hero.ctaPrimary || t.home.ctaProjects;
  const heroCtaSecondary = hero.ctaSecondary || t.home.ctaTalk;
  const heroKeywords = hero.keywords || t.home.keywordTags;
  const TECH = hero.promo || DEFAULT_TECH;

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
          {settingsLoading ? (
            <div className="hero-skeleton">
              <SkeletonBlock width="40%" height={14} style={{ marginBottom: 18 }} />
              <SkeletonBlock width="90%" height={54} style={{ marginBottom: 12 }} />
              <SkeletonBlock width="70%" height={54} style={{ marginBottom: 22 }} />
              <SkeletonBlock width="55%" height={18} style={{ marginBottom: 8 }} />
              <SkeletonBlock width="45%" height={18} style={{ marginBottom: 34 }} />
              <div style={{ display: "flex", gap: 14 }}>
                <SkeletonBlock width={160} height={48} />
                <SkeletonBlock width={160} height={48} />
              </div>
            </div>
          ) : (
            <div>
              <div className="hero-kicker">{heroKicker}</div>
              <h1>{heroH1a}<br />{heroH1b}<em>{heroH1em}</em></h1>
              <p className="hero-desc">{heroDesc}</p>
              <div className="hero-actions">
                <Link to="/projects" className="btn btn-primary">{heroCtaPrimary}</Link>
                <Link to="/contact" className="btn btn-ghost">{heroCtaSecondary}</Link>
              </div>
              <ul className="hero-keywords" aria-label="Layanan">
                {heroKeywords.map((kw) => <li key={kw}>{kw}</li>)}
              </ul>
            </div>
          )}
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
          {projectsLoading ? (
            <SkeletonGrid count={3} lines={2} />
          ) : (
            <div className="grid-3">
              {featured.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
            </div>
          )}
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
          {servicesLoading ? (
            <SkeletonGrid count={3} lines={2} />
          ) : (
            <ServicesCarousel items={serviceCarouselItems} />
          )}
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
            <div className="auto-grid">
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
