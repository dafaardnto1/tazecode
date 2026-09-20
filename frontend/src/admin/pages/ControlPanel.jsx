import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const SECTIONS = [
  {
    key: "beranda",
    label: "Beranda — Hero",
    fields: [
      ["hero_kicker", "Kicker (teks kecil di atas judul)", "text", "Jasa Website Murah untuk Bisnis Indonesia"],
      ["hero_title_line1", "Judul — Baris 1", "text", "Jasa Website Murah"],
      ["hero_title_line2", "Judul — Baris 2", "text", "untuk bisnis yang butuh "],
      ["hero_title_highlight", "Judul — Kata yang Disorot (warna hijau)", "text", "hasil cepat."],
      ["hero_desc", "Deskripsi", "textarea", ""],
      ["hero_cta_primary", "Tombol Utama", "text", "Lihat Portofolio"],
      ["hero_cta_secondary", "Tombol Kedua", "text", "Konsultasi Gratis"],
      ["hero_keywords", "Tag Kata Kunci (pisahkan koma)", "text", "Jasa Website Murah, Jasa Landing Page, Jasa IT Murah"],
      ["hero_promo_text", "Teks Promo Berjalan (pisahkan koma)", "text", "Diskon 30% Website, Gratis Domain 1 Tahun"]
    ]
  },
  {
    key: "harga",
    label: "Halaman Harga",
    fields: [
      ["page_pricing_eyebrow", "Eyebrow", "text", "Harga"],
      ["page_pricing_title", "Judul Halaman", "text", "Harga Jasa Website Murah & Transparan."],
      ["page_pricing_desc", "Deskripsi", "textarea", ""],
      ["page_pricing_note", "Catatan di bawah kartu harga", "text", "Harga dapat menyesuaikan kompleksitas kebutuhan."]
    ]
  },
  {
    key: "portofolio",
    label: "Halaman Portofolio",
    fields: [
      ["page_projects_eyebrow", "Eyebrow", "text", "Portofolio"],
      ["page_projects_title", "Judul Halaman", "text", "Portofolio Jasa Website & Aplikasi Web."],
      ["page_projects_desc", "Deskripsi", "textarea", ""]
    ]
  },
  {
    key: "layanan",
    label: "Halaman Layanan",
    fields: [
      ["page_services_eyebrow", "Eyebrow", "text", "Layanan Kami"],
      ["page_services_title", "Judul Halaman", "text", "Jasa Website, Landing Page & IT Murah"],
      ["page_services_desc", "Deskripsi", "textarea", ""]
    ]
  },
  {
    key: "kontak",
    label: "Halaman Kontak",
    fields: [
      ["page_contact_eyebrow", "Eyebrow", "text", "Kontak"],
      ["page_contact_title", "Judul Halaman", "text", "Diskusikan project website Anda sekarang."],
      ["page_contact_desc", "Deskripsi", "textarea", ""],
      ["contact_response_badge", "Badge Waktu Respon (opsional)", "text", "Rata-rata balas dalam 2 jam"]
    ]
  }
];

export default function ControlPanel() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => setLoadError("Tidak bisa memuat pengaturan. Pastikan API/Worker sudah aktif."));
  }, []);

  function setField(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setStatus({ type: "success", text: "Konten berhasil disimpan dan langsung tampil di website." });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const section = SECTIONS.find((s) => s.key === activeSection);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Control Panel</div>
          <div className="admin-subtitle">Atur judul, deskripsi, dan teks-teks tiap halaman langsung dari sini — tanpa sentuh kode. Kosongkan field untuk kembali ke teks default.</div>
        </div>
      </div>

      {loadError && <div className="admin-alert">{loadError}</div>}

      {settings && (
        <div className="admin-panel">
          <div className="control-panel-tabs">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`control-panel-tab${activeSection === s.key ? " active" : ""}`}
                onClick={() => setActiveSection(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
            {status && <div className={`admin-alert${status.type === "success" ? " success" : ""}`}>{status.text}</div>}

            {section.fields.map(([key, label, type, placeholder]) => (
              <div className="admin-field" key={key}>
                <label htmlFor={key}>{label}</label>
                {type === "textarea" ? (
                  <textarea id={key} rows={3} value={settings[key] || ""} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
                ) : (
                  <input id={key} value={settings[key] || ""} onChange={(e) => setField(key, e.target.value)} placeholder={placeholder} />
                )}
              </div>
            ))}

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn primary" disabled={saving}>
                {saving ? "Menyimpan…" : "Simpan Konten"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
