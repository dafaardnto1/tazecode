import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAnalyticsSummary()
      .then(setData)
      .catch(() => setError("Tidak bisa memuat data analitik. Pastikan API/Worker sudah aktif."))
      .finally(() => setLoading(false));
  }, []);

  const maxDayViews = data?.byDay?.length ? Math.max(...data.byDay.map((d) => d.views)) : 0;

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-title">Analitik Kunjungan</div>
          <div className="admin-subtitle">Ringkasan kunjungan website (tracking internal). Untuk data pencarian Google, hubungkan Google Search Console secara terpisah.</div>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <div className="admin-loading">Memuat…</div>
      ) : !data ? null : (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat">
              <div className="admin-stat-num">{data.total}</div>
              <div className="admin-stat-label">Total Kunjungan</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-num">{data.last7Days}</div>
              <div className="admin-stat-label">7 Hari Terakhir</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat-num">{data.last30Days}</div>
              <div className="admin-stat-label">30 Hari Terakhir</div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head"><h2>Kunjungan Harian (14 Hari)</h2></div>
            {data.byDay.length === 0 ? (
              <div className="admin-empty">Belum ada data.</div>
            ) : (
              <div className="analytics-chart">
                {data.byDay.map((d) => {
                  const pct = maxDayViews ? Math.max(3, Math.round((d.views / maxDayViews) * 100)) : 3;
                  return (
                    <div className="analytics-bar-col" key={d.day} title={`${d.day}: ${d.views} kunjungan`}>
                      <div className="analytics-bar-value">{d.views}</div>
                      <div className="analytics-bar-track">
                        <div className="analytics-bar" style={{ height: `${pct}%` }} />
                      </div>
                      <div className="analytics-bar-label">{d.day.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head"><h2>Halaman Terpopuler (30 Hari)</h2></div>
            {data.byPath.length === 0 ? (
              <div className="admin-empty">Belum ada data.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Halaman</th><th>Kunjungan</th></tr></thead>
                  <tbody>
                    {data.byPath.map((p) => (
                      <tr key={p.path}><td>{p.path}</td><td>{p.views}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head"><h2>Sumber Kunjungan (30 Hari)</h2></div>
            {data.byReferrer.length === 0 ? (
              <div className="admin-empty">Belum ada data.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Referrer</th><th>Kunjungan</th></tr></thead>
                  <tbody>
                    {data.byReferrer.map((r) => (
                      <tr key={r.referrer}><td>{r.referrer}</td><td>{r.views}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="admin-panel">
            <div className="admin-panel-head"><h2>Insight Pencarian Google</h2></div>
            <div style={{ padding: 20, color: "var(--muted)", fontSize: 14 }}>
              Data kata kunci pencarian Google (klik, impresi, posisi) berasal dari <strong>Google Search Console</strong>,
              yang butuh verifikasi domain dan login akun Google terpisah — tidak bisa ditarik otomatis dari sini.
              Setelah situs live di <code>tazecode.pages.dev</code> (atau domain custom), daftarkan di{" "}
              <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">search.google.com/search-console</a>{" "}
              untuk melihat insight pencarian lengkap.
            </div>
          </div>
        </>
      )}
    </>
  );
}
