import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useSettings } from "../hooks/useApiData";

export default function Footer() {
  const { t } = useLanguage();
  const { settings } = useSettings();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand"><span className="dot" />TAZECODE</Link>
            <p className="footer-desc">{t.footer.desc}</p>
          </div>
          <div>
            <div className="footer-head">{t.footer.navigate}</div>
            <div className="footer-links">
              <Link to="/harga">{t.nav.pricelist}</Link>
              <Link to="/projects">{t.nav.projects}</Link>
              <Link to="/services">{t.nav.services}</Link>
              <Link to="/contact">{t.nav.contact}</Link>
            </div>
          </div>
          <div>
            <div className="footer-head">{t.footer.connect}</div>
            <div className="footer-links">
              {settings.contact_github && <a href={settings.contact_github} target="_blank" rel="noopener noreferrer">GitHub</a>}
              {settings.contact_linkedin && <a href={settings.contact_linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>}
              {settings.contact_whatsapp && <a href={`https://wa.me/${settings.contact_whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              {settings.contact_email && <a href={`mailto:${settings.contact_email}`}>Email</a>}
              {settings.contact_instagram && <a href={settings.contact_instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} TAZECODE. {t.footer.rights}</span>
          <a href="#top" className="back-to-top">{t.footer.backToTop}</a>
        </div>
      </div>
    </footer>
  );
}
