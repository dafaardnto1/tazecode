import { Link, useParams } from "react-router-dom";
import { useProjects } from "../hooks/useApiData";
import ProjectGallery from "../components/ProjectGallery";
import Seo from "../components/Seo";
import { useLanguage } from "../i18n/LanguageContext";
import { SITE_URL, SITE_NAME } from "../lib/seoConfig";

export default function ProjectDetail() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const d = t.detail;
  const { projects, loading } = useProjects();
  const project = projects.find((p) => p.slug === slug);

  if (loading && !project) {
    return <div className="admin-loading">…</div>;
  }

  if (!project) {
    return (
      <>
        <Seo title={t.meta.notFound.title} description={t.meta.notFound.desc} noindex />
        <div className="container notfound-msg">
          <p className="eyebrow" style={{ justifyContent: "center" }}>{d.notFoundEyebrow}</p>
          <h1 className="section-title" style={{ marginInline: "auto" }}>{d.notFoundTitle}</h1>
          <p className="section-desc" style={{ marginInline: "auto", marginTop: 14 }}>{d.notFoundDesc}</p>
          <div style={{ marginTop: 28 }}><Link to="/projects" className="btn btn-primary">{d.backBtn}</Link></div>
        </div>
      </>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: project.description,
    creator: { "@type": "Organization", name: SITE_NAME },
    url: `${SITE_URL}/projects/${project.slug}`,
    keywords: project.tech.join(", ")
  };

  return (
    <>
      <Seo title={`${project.name} — ${SITE_NAME}`} description={project.description} jsonLd={jsonLd} />

      <section className="detail-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/projects">{t.nav.projects}</Link><span>/</span><span>{project.name}</span>
          </div>
          <div className="eyebrow">{project.category}</div>
          <h1 className="section-title" style={{ maxWidth: 800 }}>{project.name}</h1>
          <p className="section-desc" style={{ marginTop: 14 }}>{project.description}</p>
          <div className="detail-meta-row">
            <div><span>{d.client}</span>{project.client}</div>
            <div><span>{d.year}</span>{project.year}</div>
            <div><span>{d.role}</span>{project.role}</div>
            <div><span>{d.duration}</span>{project.duration}</div>
          </div>
          <div className="hero-actions" style={{ marginTop: 28 }}>
            {project.live ? (
              <a href={project.live} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{d.liveDemo}</a>
            ) : (
              <span className="btn btn-primary btn-disabled">{d.liveNA}</span>
            )}
            {project.github ? (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">{d.github}</a>
            ) : (
              <span className="btn btn-ghost btn-disabled">{d.githubNA}</span>
            )}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 48 }}>
        <div className="container">
          {project.thumbnail_url ? (
            <img className="detail-visual detail-visual-img" src={project.thumbnail_url} alt={project.name} />
          ) : (
            <div className="detail-visual">{d.screenshot}</div>
          )}
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <ProjectGallery projectId={project.id} projectName={project.name} />
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="container detail-body">
          <div>
            <div className="detail-section">
              <h3>{d.problem}</h3>
              <p>{project.problem}</p>
            </div>
            <div className="detail-section">
              <h3>{d.solution}</h3>
              <p>{project.solution}</p>
            </div>
            <div className="detail-section">
              <h3>{d.features}</h3>
              <ul className="feature-list">
                {project.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
            {project.challenges && (
              <div className="detail-section">
                <h3>{d.challenges}</h3>
                <p>{project.challenges}</p>
              </div>
            )}
            {project.result && (
              <div className="detail-section">
                <h3>{d.result}</h3>
                <p>{project.result}</p>
              </div>
            )}
          </div>
          <aside className="detail-side">
            <div className="side-block">
              <span>{d.technologies}</span>
              <div className="project-tags">
                {project.tech.map((tech) => <span className="tag" key={tech}>{tech}</span>)}
              </div>
            </div>
            <div className="side-block"><span>{d.category}</span><strong>{project.category}</strong></div>
            <div className="side-block"><span>{d.client}</span><strong>{project.client}</strong></div>
            <div className="side-block"><span>{d.myRole}</span><strong>{project.role}</strong></div>
          </aside>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <h2>{d.ctaTitle}</h2>
          <Link to="/contact" className="btn btn-primary">{d.ctaBtn}</Link>
        </div>
      </section>
    </>
  );
}
