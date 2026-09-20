import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Pricelist from "./pages/Pricelist";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import { AdminAuthProvider } from "./admin/AuthContext";
import ProtectedRoute from "./admin/ProtectedRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/pages/Login";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminProjects from "./admin/pages/Projects";
import AdminServices from "./admin/pages/Services";
import AdminPricing from "./admin/pages/Pricing";
import AdminProcess from "./admin/pages/Process";
import AdminFaq from "./admin/pages/Faq";
import AdminTestimonials from "./admin/pages/Testimonials";
import AdminMessages from "./admin/pages/Messages";
import AdminSubscribers from "./admin/pages/Subscribers";
import AdminAnalytics from "./admin/pages/Analytics";
import AdminSettings from "./admin/pages/Settings";
import AdminControlPanel from "./admin/pages/ControlPanel";

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/harga" element={<Pricelist />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="process" element={<AdminProcess />} />
          <Route path="faq" element={<AdminFaq />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="subscribers" element={<AdminSubscribers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="control-panel" element={<AdminControlPanel />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
