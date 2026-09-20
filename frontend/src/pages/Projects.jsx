import { useMemo, useState } from "react";
import ProjectCard from "../components/ProjectCard";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { SkeletonGrid } from "../components/Skeleton";
import { useProjects, useSettings } from "../hooks/useApiData";
import { useAutoTranslate } from "../hooks/useAutoTranslate";
import { useLanguage } from "../i18n/LanguageContext";

export default function Projects() {
  const { t } = useLanguage();
  const p = t.projects;
  const { projects, loading } = useProjects();
  const { settings } = useSettings();
  const page = useAutoTranslate({
    eyebrow: settings.page_projects_eyebrow,
    title: settings.page_projects_title,
    desc: settings.page_projects_desc
  });
  const pageEyebrow = page.eyebrow || p.eyebrow;
  const pageTitle = page.title || p.title;
  const pageDesc = page.desc || p.desc;
  const categories = useMemo(() => [p.all, ...new Set(projects.map((pr) => pr.category))], [p.all, projects]);
  const [activeCat, setActiveCat] = useState(p.all);
  const [term, setTerm] = useState("");

  const filtered = projects.filter((pr) => {
    const matchCat = activeCat === p.all || pr.category === activeCat;
    const q = term.trim().toLowerCase();
    const matchTerm = !q || pr.name.toLowerCase().includes(q) || pr.tech.join(" ").toLowerCase().includes(q);
    return matchCat && matchTerm;
  });

  return (
    <>
      <Seo title={t.meta.projects.title} description={t.meta.projects.desc} />

      <section style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="eyebrow">{pageEyebrow}</div>
          <h1 className="section-title">{pageTitle}</h1>
          <p className="section-desc" style={{ marginTop: 14 }}>{pageDesc}</p>
        </div>
      </section>

      <Reveal>
        <div className="container">
          <div className="projects-toolbar">
            <div className="filters" role="group" aria-label="Filter projects by category">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-btn${activeCat === c ? " active" : ""}`}
                  aria-pressed={activeCat === c}
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              className="search-input"
              type="search"
              placeholder={p.searchPlaceholder}
              aria-label={p.searchPlaceholder}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <SkeletonGrid count={6} lines={2} />
          ) : filtered.length === 0 ? (
            <div className="empty-state">{p.empty}</div>
          ) : (
            <div className="grid-3">
              {filtered.map((pr, i) => <ProjectCard key={pr.slug} project={pr} index={i} />)}
            </div>
          )}
        </div>
      </Reveal>
    </>
  );
}
