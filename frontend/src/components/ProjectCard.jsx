import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProjectCard({ project, index }) {
  const { t } = useLanguage();

  function handleMouseMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${(x * 6).toFixed(2)}deg`);
  }

  function handleMouseLeave(e) {
    const card = e.currentTarget;
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <Link
      className="project-card"
      to={`/projects/${project.slug}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="project-thumb">
        {project.thumbnail_url ? (
          <img src={project.thumbnail_url} alt={project.name} className="project-thumb-img" />
        ) : (
          <span className="num">{String(index + 1).padStart(2, "0")}</span>
        )}
      </div>
      <div className="project-body">
        <div className="project-cat">{project.category}</div>
        <div className="project-name">{project.name}</div>
        <p className="project-desc">{project.description}</p>
        <div className="project-tags">
          {project.tech.map((tech) => <span className="tag" key={tech}>{tech}</span>)}
        </div>
      </div>
      <div className="project-link"><span>{t.projects.viewProject}</span><span>→</span></div>
    </Link>
  );
}
