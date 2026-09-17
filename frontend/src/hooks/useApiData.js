import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PROJECTS as STATIC_PROJECTS } from "../data/projects";

// Fetches live data from the Worker API; falls back to the bundled static
// data if the API is unreachable (e.g. Worker not deployed yet, or offline).
export function useProjects() {
  const [projects, setProjects] = useState(STATIC_PROJECTS);
  const [source, setSource] = useState("static");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getProjects()
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setProjects(data);
          setSource("api");
        }
      })
      .catch(() => {
        /* keep static fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { projects, source, loading };
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getTestimonials()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setTestimonials(data);
      })
      .catch(() => {
        /* no testimonials until API is reachable — never show fake ones */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { testimonials, loading };
}

const DEFAULT_SETTINGS = {
  stats_projects: "15",
  stats_clients: "8",
  stats_years: "3",
  stats_tech: "10",
  contact_whatsapp: "6280000000000",
  contact_email: "hello@tazecode.dev",
  contact_github: "https://github.com/",
  contact_linkedin: "https://linkedin.com/",
  contact_instagram: ""
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getSettings()
      .then((data) => {
        if (!cancelled && data && Object.keys(data).length > 0) {
          setSettings((s) => ({ ...s, ...data }));
        }
      })
      .catch(() => {
        /* keep defaults */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}

const DEFAULT_PRICING = [
  { id: 1, name: "Landing Page", price: "750000", price_suffix: "mulai dari", description: "Cocok untuk promosi produk atau campaign singkat.", features: ["1 Halaman Landing Page", "Desain Responsif", "Form Kontak/WhatsApp", "Selesai 3-5 Hari"], is_popular: false },
  { id: 2, name: "Company Profile", price: "1500000", price_suffix: "mulai dari", description: "Website profesional untuk membangun kredibilitas bisnis.", features: ["Hingga 5 Halaman", "Desain Responsif", "SEO Dasar", "Gratis Domain 1 Tahun", "Selesai 5-7 Hari"], is_popular: true },
  { id: 3, name: "Toko Online", price: "3000000", price_suffix: "mulai dari", description: "Toko online lengkap dengan katalog dan checkout.", features: ["Katalog Produk", "Keranjang & Checkout", "Dashboard Admin", "Gratis Domain 1 Tahun", "Selesai 7-14 Hari"], is_popular: false },
  { id: 4, name: "Aplikasi Web Custom", price: "Hubungi Kami", price_suffix: "", description: "Sistem custom sesuai kebutuhan bisnis Anda (POS, rental, dll).", features: ["Analisa Kebutuhan", "Fitur Sesuai Permintaan", "Dashboard Admin", "Support Berkelanjutan"], is_popular: false }
];

export function usePricing() {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getPricing()
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setPricing(data);
      })
      .catch(() => {
        /* keep static fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { pricing, loading };
}

const DEFAULT_PROCESS_STEPS = [
  { id: 1, title: "Diskusi Kebutuhan", description: "Memahami tujuan, target pengguna, dan masalah yang perlu diselesaikan website Anda." },
  { id: 2, title: "Perencanaan", description: "Menentukan scope, struktur, dan timeline sebelum mulai coding." },
  { id: 3, title: "Pengerjaan", description: "Development bertahap dengan update rutin, tanpa kejutan di tengah jalan." },
  { id: 4, title: "Rilis & Dukungan", description: "Deployment, testing, dan dukungan setelah website live." }
];

export function useProcessSteps() {
  const [steps, setSteps] = useState(DEFAULT_PROCESS_STEPS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getProcessSteps()
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setSteps(data);
      })
      .catch(() => {
        /* keep static fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { steps, loading };
}

const DEFAULT_FAQS = [
  { id: 1, question: "Berapa lama waktu pengerjaan website?", answer: "Tergantung paket dan kompleksitas. Landing page biasanya 3-5 hari kerja, company profile 1-2 minggu, dan toko online/aplikasi custom 2-4 minggu." },
  { id: 2, question: "Apakah bisa revisi desain?", answer: "Bisa. Setiap paket sudah termasuk jatah revisi sesuai paket yang dipilih." },
  { id: 3, question: "Sistem pembayarannya bagaimana?", answer: "Umumnya DP 50% di awal, sisanya dilunasi setelah website selesai dan disetujui." }
];

export function useFaqs() {
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getFaqs()
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setFaqs(data);
      })
      .catch(() => {
        /* keep static fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { faqs, loading };
}

export function useArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getArticles()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setArticles(data);
      })
      .catch(() => {
        /* no articles until API is reachable */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { articles, loading };
}

export function useServices(staticServices) {
  const [services, setServices] = useState(staticServices);
  const [source, setSource] = useState("static");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getServices()
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setServices(data);
          setSource("api");
        }
      })
      .catch(() => {
        /* keep static fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { services, source, loading };
}
