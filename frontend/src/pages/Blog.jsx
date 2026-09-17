import { Link } from "react-router-dom";
import NewsletterForm from "../components/NewsletterForm";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SkeletonGrid } from "../components/Skeleton";
import { useArticles } from "../hooks/useApiData";
import { useLanguage } from "../i18n/LanguageContext";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export default function Blog() {
  const { t } = useLanguage();
  const b = t.blog;
  const { articles, loading } = useArticles();

  return (
    <>
      <Seo title={t.meta.blog.title} description={t.meta.blog.desc} />

      <section style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="eyebrow">{b.eyebrow}</div>
          <h1 className="section-title">{b.title}</h1>
          <p className="section-desc" style={{ marginTop: 14 }}>{b.desc}</p>
        </div>
      </section>

      <Reveal>
        <div className="container">
          {loading ? (
            <SkeletonGrid count={3} lines={2} />
          ) : articles.length === 0 ? (
            <div className="empty-state">{b.empty}</div>
          ) : (
            <div className="grid-3">
              {articles.map((a) => (
                <Link to={`/blog/${a.slug}`} className="blog-card" key={a.id}>
                  {a.cover_image_url && (
                    <div className="blog-card-thumb">
                      <img src={a.cover_image_url} alt={a.title} loading="lazy" />
                    </div>
                  )}
                  <div className="blog-card-body">
                    <div className="blog-card-date">{formatDate(a.created_at)}</div>
                    <h2 className="blog-card-title">{a.title}</h2>
                    {a.excerpt && <p className="blog-card-excerpt">{a.excerpt}</p>}
                    <span className="blog-card-link">{b.readMore} →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div className="container">
          <NewsletterForm />
        </div>
      </Reveal>
    </>
  );
}
