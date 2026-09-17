import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ScrollProgress from "./ScrollProgress";
import WhatsAppFloat from "./WhatsAppFloat";
import { api } from "../lib/api";

export default function Layout() {
  const location = useLocation();
  const [transitionKey, setTransitionKey] = useState(location.pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
    setTransitionKey(location.pathname);
    api.track(location.pathname, document.referrer);
  }, [location.pathname]);

  return (
    <div id="top">
      <a className="skip-link" href="#main">Skip to content</a>
      <ScrollProgress />
      <Header />
      <main id="main" key={transitionKey} className="page-transition">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
