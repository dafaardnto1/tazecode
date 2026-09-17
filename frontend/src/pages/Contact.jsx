import { useRef, useState } from "react";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import { useLanguage } from "../i18n/LanguageContext";
import { api } from "../lib/api";
import { useSettings } from "../hooks/useApiData";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const { t } = useLanguage();
  const c = t.contact;
  const { settings } = useSettings();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type: "success" | "error", text }
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const loadedAtRef = useRef(Date.now());

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!values.name.trim()) next.name = c.errName;
    if (!values.email.trim()) next.email = c.errEmail;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = c.errEmailInvalid;
    if (!values.subject.trim()) next.subject = c.errSubject;
    if (!values.message.trim() || values.message.trim().length < 10) next.message = c.errMessage;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    if (!validate()) {
      setStatus({ type: "error", text: c.errGeneric });
      return;
    }

    // Bot heuristics: honeypot field filled, or submitted implausibly fast.
    if (honeypot.trim() || Date.now() - loadedAtRef.current < 2500) {
      setStatus({ type: "success", text: c.successMsg });
      setValues(EMPTY);
      return;
    }

    setSubmitting(true);
    try {
      await api.sendMessage({ ...values, website: honeypot });
      setStatus({ type: "success", text: c.successMsg });
      setValues(EMPTY);
    } catch (err) {
      setStatus({
        type: "error",
        text: err.status === 429 ? c.errRateLimit : (err.message === "Failed to fetch" ? c.errNetwork : err.message)
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(settings.contact_email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <Seo title={t.meta.contact.title} description={t.meta.contact.desc} />

      <section style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="eyebrow">{c.eyebrow}</div>
          <h1 className="section-title">{c.title}</h1>
          <p className="section-desc" style={{ marginTop: 14 }}>{c.desc}</p>
        </div>
      </section>

      <Reveal>
        <div className="container contact-grid">
          <div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-honeypot" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
              <div className={`field${errors.name ? " has-error" : ""}`}>
                <label htmlFor="name">{c.labelName}</label>
                <input type="text" id="name" name="name" autoComplete="name" value={values.name} onChange={handleChange} />
                <div className="error">{errors.name}</div>
              </div>
              <div className={`field${errors.email ? " has-error" : ""}`}>
                <label htmlFor="email">{c.labelEmail}</label>
                <input type="email" id="email" name="email" autoComplete="email" value={values.email} onChange={handleChange} />
                <div className="error">{errors.email}</div>
              </div>
              <div className="field">
                <label htmlFor="phone">{c.labelPhone}</label>
                <input type="tel" id="phone" name="phone" autoComplete="tel" placeholder="08xxxxxxxxxx" value={values.phone} onChange={handleChange} />
              </div>
              <div className={`field${errors.subject ? " has-error" : ""}`}>
                <label htmlFor="subject">{c.labelSubject}</label>
                <input type="text" id="subject" name="subject" value={values.subject} onChange={handleChange} />
                <div className="error">{errors.subject}</div>
              </div>
              <div className={`field${errors.message ? " has-error" : ""}`}>
                <label htmlFor="message">{c.labelMessage}</label>
                <textarea id="message" name="message" rows="6" value={values.message} onChange={handleChange} />
                <div className="error">{errors.message}</div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? c.sending : c.send}
              </button>
              <div className={`form-status${status ? ` ${status.type}` : ""}`} role="status" aria-live="polite">
                {status?.text}
              </div>
            </form>
          </div>

          <div>
            <div className="contact-channels">
              <a className="channel" href={`mailto:${settings.contact_email}`}><span>Email</span><span>{settings.contact_email}</span></a>
              <a className="channel" href={`https://wa.me/${settings.contact_whatsapp}`} target="_blank" rel="noopener noreferrer"><span>WhatsApp</span><span>+{settings.contact_whatsapp}</span></a>
              <a className="channel" href={settings.contact_github} target="_blank" rel="noopener noreferrer"><span>GitHub</span><span>{settings.contact_github?.replace(/^https?:\/\//, "")}</span></a>
              <a className="channel" href={settings.contact_linkedin} target="_blank" rel="noopener noreferrer"><span>LinkedIn</span><span>{settings.contact_linkedin?.replace(/^https?:\/\//, "")}</span></a>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="btn btn-ghost btn-sm" type="button" onClick={copyEmail}>
                {copied ? c.copied : c.copyEmail}
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}
