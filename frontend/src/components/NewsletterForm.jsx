import { useState } from "react";
import { api } from "../lib/api";
import { useLanguage } from "../i18n/LanguageContext";

export default function NewsletterForm() {
  const { t } = useLanguage();
  const n = t.newsletter;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "sending" | "done" | "error"

  async function handleSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await api.subscribe(email);
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <div className="newsletter-box"><p className="newsletter-success">{n.success}</p></div>;
  }

  return (
    <div className="newsletter-box">
      <div className="newsletter-text">
        <h3>{n.title}</h3>
        <p>{n.desc}</p>
      </div>
      <form className="newsletter-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={n.placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? n.sending : n.cta}
        </button>
      </form>
      {status === "error" && <p className="newsletter-error">{n.error}</p>}
    </div>
  );
}
