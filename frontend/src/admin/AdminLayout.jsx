import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAdminAuth } from "./AuthContext";

const LINKS = [
  ["/admin", "Dashboard", true],
  ["/admin/control-panel", "Control Panel", false],
  ["/admin/projects", "Projects", false],
  ["/admin/services", "Services", false],
  ["/admin/pricing", "Harga / Pricelist", false],
  ["/admin/process", "Cara Kerja", false],
  ["/admin/faq", "FAQ", false],
  ["/admin/testimonials", "Testimonials", false],
  ["/admin/messages", "Messages", false],
  ["/admin/subscribers", "Subscribers", false],
  ["/admin/analytics", "Analitik", false],
  ["/admin/settings", "Settings", false]
];

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="admin">
      <Helmet>
        <title>Admin — TAZECODE</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="admin-topbar">
        <div className="admin-brand"><span className="dot" />TAZECODE<span style={{ color: "var(--muted)", fontWeight: 400 }}>/admin</span></div>
        <button className="admin-menu-toggle" type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <span></span><span></span><span></span>
        </button>
      </header>

      <div className={`admin-sidebar-overlay${open ? " open" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <aside className={`admin-sidebar${open ? " open" : ""}`}>
        <div className="admin-brand admin-brand-desktop"><span className="dot" />TAZECODE<span style={{ color: "var(--muted)", fontWeight: 400 }}>/admin</span></div>
        <button className="admin-menu-close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
          <span className="x1"></span><span className="x2"></span>
        </button>
        <nav className="admin-nav">
          {LINKS.map(([href, label, end]) => (
            <NavLink key={href} to={href} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-user">Logged in as <strong>{user?.username}</strong></div>
          <button className="admin-logout" type="button" onClick={handleLogout}>Log Out</button>
          <a className="admin-back-site" href="/">← Back to site</a>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
