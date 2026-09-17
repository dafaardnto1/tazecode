import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../i18n/LanguageContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();

  const LINKS = [
    ["/", t.nav.home],
    ["/harga", t.nav.pricelist],
    ["/projects", t.nav.projects],
    ["/services", t.nav.services],
    ["/blog", t.nav.blog],
    ["/contact", t.nav.contact]
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Primary">
        <Link to="/" className="brand">
          <img src="/logo.png" alt="TAZECODE" className="brand-logo" />
          TAZECODE
        </Link>
        <div className="nav-links">
          {LINKS.map(([href, label]) => (
            <NavLink key={href} to={href} end={href === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </div>
        <div className="nav-right">
          <button className="lang-toggle" type="button" aria-label="Switch language" onClick={toggleLang}>
            {lang === "id" ? "ID" : "EN"}
          </button>
          <button className="theme-toggle" type="button" aria-label="Toggle dark mode" onClick={toggleTheme}>
            {theme === "dark" ? "☾" : "☀"}
          </button>
          <Link to="/contact" className="nav-cta">{t.nav.talk}</Link>
          <button
            className="nav-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      <div className={`sidebar-overlay${open ? " open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`mobile-sidebar${open ? " open" : ""}`} aria-label="Mobile menu" aria-hidden={!open}>
        <div className="mobile-sidebar-head">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <img src="/logo.png" alt="TAZECODE" className="brand-logo" />
            TAZECODE
          </Link>
          <button className="nav-toggle" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
            <span className="x1"></span><span className="x2"></span>
          </button>
        </div>
        <ul>
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <NavLink to={href} end={href === "/"} onClick={() => setOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mobile-sidebar-foot">
          <Link to="/contact" className="btn btn-primary" onClick={() => setOpen(false)} style={{ width: "100%", justifyContent: "center" }}>
            {t.nav.talk}
          </Link>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="theme-toggle theme-toggle-wide" type="button" aria-label="Toggle dark mode" onClick={toggleTheme} style={{ flex: 1 }}>
              {theme === "dark" ? "☾ Dark" : "☀ Light"}
            </button>
            <button className="lang-toggle lang-toggle-wide" type="button" aria-label="Switch language" onClick={toggleLang} style={{ flex: 1 }}>
              {lang === "id" ? "Bahasa: ID" : "Language: EN"}
            </button>
          </div>
        </div>
      </aside>
    </header>
  );
}
