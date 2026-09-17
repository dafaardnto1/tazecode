import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  const n = t.notFound;

  return (
    <>
      <Seo title={t.meta.notFound.title} description={t.meta.notFound.desc} noindex />
      <div className="container error-page">
        <div className="error-terminal">
          <div className="error-terminal-bar">
            <span className="error-dot" style={{ background: "#ff5f56" }} />
            <span className="error-dot" style={{ background: "#ffbd2e" }} />
            <span className="error-dot" style={{ background: "#27c93f" }} />
            <span className="error-terminal-title">tazecode — zsh</span>
          </div>
          <div className="error-terminal-body">
            <div><span className="error-prompt">$</span> cd {typeof window !== "undefined" ? window.location.pathname : "/halaman-ini"}</div>
            <div className="error-output">bash: cd: No such file or directory</div>
            <div><span className="error-prompt">$</span> <span className="error-cursor">▍</span></div>
          </div>
        </div>

        <div className="error-code">404</div>
        <h1 className="section-title">{n.title}</h1>
        <p className="section-desc">{n.desc}</p>

        <div className="error-links">
          <Link to="/" className="btn btn-primary">{n.backBtn}</Link>
          <Link to="/harga" className="btn btn-ghost">{n.linkPricing}</Link>
          <Link to="/blog" className="btn btn-ghost">{n.linkBlog}</Link>
          <Link to="/contact" className="btn btn-ghost">{n.linkContact}</Link>
        </div>
      </div>
    </>
  );
}
