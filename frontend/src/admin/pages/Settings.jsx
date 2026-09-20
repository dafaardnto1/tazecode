import { useEffect, useState } from "react";
import { api, API_URL } from "../../lib/api";
import ImageUpload from "../components/ImageUpload";
import PasswordInput from "../components/PasswordInput";

export default function AdminSettings() {
  const [siteSettings, setSiteSettings] = useState(null);
  const [savingSite, setSavingSite] = useState(false);
  const [siteStatus, setSiteStatus] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwStatus, setPwStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getSettings()
      .then(setSiteSettings)
      .catch(() => setLoadError("Tidak bisa memuat pengaturan. Pastikan API/Worker sudah aktif."));
  }, []);

  function setField(key, value) {
    setSiteSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSiteSubmit(e) {
    e.preventDefault();
    setSiteStatus(null);
    setSavingSite(true);
    try {
      await api.updateSettings(siteSettings);
      setSiteStatus({ type: "success", text: "Pengaturan berhasil disimpan." });
    } catch (err) {
      setSiteStatus({ type: "error", text: err.message });
    } finally {
      setSavingSite(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwStatus(null);
    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();
    if (next.length < 8) {
      setPwStatus({ type: "error", text: "Password baru minimal 8 karakter." });
      return;
    }
    if (next !== confirm) {
      setPwStatus({ type: "error", text: "Konfirmasi password tidak cocok." });
      return;
    }
    setSubmitting(true);
    try {
      await api.changePassword(current, next);
      setPwStatus({ type: "success", text: `Password berhasil diubah menjadi: "${next}" — catat sekarang, akan hilang setelah Anda tinggalkan halaman ini.` });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwStatus({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Settings</div>
          <div className="admin-subtitle">Statistik homepage, info kontak, dan akun admin. Untuk konten teks tiap halaman, buka menu Control Panel.</div>
        </div>
      </div>

      {loadError && <div className="admin-alert">{loadError}</div>}

      {siteSettings && (
        <div className="admin-panel">
          <div className="admin-panel-head"><h2>Statistik Homepage</h2></div>
          <form className="admin-form" onSubmit={handleSiteSubmit}>
            {siteStatus && <div className={`admin-alert${siteStatus.type === "success" ? " success" : ""}`}>{siteStatus.text}</div>}
            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="stats_projects">Projects Completed</label>
                <input id="stats_projects" type="number" value={siteSettings.stats_projects || ""} onChange={(e) => setField("stats_projects", e.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="stats_clients">Clients Served</label>
                <input id="stats_clients" type="number" value={siteSettings.stats_clients || ""} onChange={(e) => setField("stats_clients", e.target.value)} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="stats_years">Years of Experience</label>
                <input id="stats_years" type="number" value={siteSettings.stats_years || ""} onChange={(e) => setField("stats_years", e.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="stats_tech">Technologies Used</label>
                <input id="stats_tech" type="number" value={siteSettings.stats_tech || ""} onChange={(e) => setField("stats_tech", e.target.value)} />
              </div>
            </div>

            <div className="admin-panel-head" style={{ margin: "8px -20px 0", borderTop: "1px solid var(--line-soft)" }}><h2>Foto Profil (Halaman About)</h2></div>
            <ImageUpload label="Foto Profil" value={siteSettings.about_photo_url || ""} onChange={(url) => setField("about_photo_url", url)} />

            <div className="admin-panel-head" style={{ margin: "8px -20px 0", borderTop: "1px solid var(--line-soft)" }}><h2>Info Kontak</h2></div>

            <div className="admin-field">
              <label htmlFor="contact_email">Email</label>
              <input id="contact_email" type="email" value={siteSettings.contact_email || ""} onChange={(e) => setField("contact_email", e.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor="contact_whatsapp">WhatsApp (angka saja, format 62…)</label>
              <input id="contact_whatsapp" value={siteSettings.contact_whatsapp || ""} onChange={(e) => setField("contact_whatsapp", e.target.value)} placeholder="6281234567890" />
            </div>
            <div className="admin-form-row">
              <div className="admin-field">
                <label htmlFor="contact_github">GitHub URL</label>
                <input id="contact_github" value={siteSettings.contact_github || ""} onChange={(e) => setField("contact_github", e.target.value)} />
              </div>
              <div className="admin-field">
                <label htmlFor="contact_linkedin">LinkedIn URL</label>
                <input id="contact_linkedin" value={siteSettings.contact_linkedin || ""} onChange={(e) => setField("contact_linkedin", e.target.value)} />
              </div>
            </div>
            <div className="admin-field">
              <label htmlFor="contact_instagram">Instagram URL (opsional)</label>
              <input id="contact_instagram" value={siteSettings.contact_instagram || ""} onChange={(e) => setField("contact_instagram", e.target.value)} />
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn primary" disabled={savingSite}>
                {savingSite ? "Menyimpan…" : "Simpan Pengaturan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Koneksi API</h2></div>
        <div style={{ padding: 20, fontFamily: "var(--mono)", fontSize: 13, color: "var(--muted)" }}>
          Terhubung ke: <strong style={{ color: "var(--ink)" }}>{API_URL}</strong>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-head"><h2>Ubah Password</h2></div>
        <form className="admin-form" onSubmit={handlePasswordSubmit}>
          {pwStatus && <div className={`admin-alert${pwStatus.type === "success" ? " success" : ""}`}>{pwStatus.text}</div>}
          <div className="admin-field">
            <label htmlFor="currentPassword">Password Saat Ini</label>
            <PasswordInput id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="admin-form-row">
            <div className="admin-field">
              <label htmlFor="newPassword">Password Baru</label>
              <PasswordInput id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="admin-field">
              <label htmlFor="confirmPassword">Konfirmasi Password Baru</label>
              <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="admin-btn primary" disabled={submitting}>
              {submitting ? "Menyimpan…" : "Ubah Password"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
