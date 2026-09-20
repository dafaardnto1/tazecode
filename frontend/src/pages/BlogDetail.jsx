import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NewsletterForm from "../components/NewsletterForm";
import Seo from "../components/Seo";
import { api } from "../lib/api";
import { ARTICLE_DETAIL_FIELDS } from "../hooks/useApiData";
import { useAutoTranslateFields } from "../hooks/useAutoTranslate";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_URL, SITE_NAME } from "../lib/seoConfig";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function BlogDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const b = t.blog;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    api
      .getArticleBySlug(slug)
      .then((data) => {
        if (!cancelled) setArticle(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const translated = useAutoTranslateFields(article, ARTICLE_DETAIL_FIELDS);

  if (loading) {
    return <div className="admin-loading">…</div>;
  }

  if (notFound || !translated) {
    return (
      <>
        <Seo title={t.meta.notFound.title} description={t.meta.notFound.desc} noindex />
        <div className="container notfound-msg">
          <p className="eyebrow" style={{ justifyContent: "center" }}>{b.notFoundEyebrow}</p>
          <h1 className="section-title" style={{ marginInline: "auto" }}>{b.notFoundTitle}</h1>
          <div style={{ marginTop: 28 }}><Link to="/blog" className="btn btn-primary">{b.backBtn}</Link></div>
        </div>
      </>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: translated.title,
    description: translated.excerpt || "",
    author: { "@type": "Organization", name: SITE_NAME },
    datePublished: translated.created_at,
    dateModified: translated.updated_at,
    url: `${SITE_URL}/blog/${translated.slug}`,
    ...(translated.cover_image_url ? { image: translated.cover_image_url } : {})
  };

  return (
    <>
      <Seo title={translated.title} description={translated.excerpt || translated.title} jsonLd={jsonLd} />

      <section style={{ paddingBottom: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Link to="/blog" className="blog-back-link">← {b.backBtn}</Link>
          <div className="blog-detail-date">{formatDate(translated.created_at)}</div>
          <h1 className="section-title" style={{ marginTop: 10 }}>{translated.title}</h1>
        </div>
      </section>

      <section>
        <div className="container" style={{ maxWidth: 760 }}>
          {translated.cover_image_url && (
            <div className="blog-detail-cover">
              <img src={translated.cover_image_url} alt={translated.title} />
            </div>
          )}
          <div className="blog-detail-content">
            {translated.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
