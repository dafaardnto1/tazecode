// Client for the TAZECODE Worker API (Cloudflare Workers + D1 + R2).
// Falls back gracefully when the API isn't reachable yet (e.g. before the
// Worker is deployed) — callers should catch and fall back to static data.

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8787";
const TOKEN_KEY = "tazecode-admin-token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request(path, { method = "GET", body, auth = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),

  login: (username, password) => request("/api/auth/login", { method: "POST", body: { username, password } }),
  me: () => request("/api/auth/me", { auth: true }),
  changePassword: (currentPassword, newPassword) =>
    request("/api/auth/change-password", { method: "POST", auth: true, body: { currentPassword, newPassword } }),

  getProjects: () => request("/api/projects"),
  getProject: (slug) => request(`/api/projects/${slug}`),
  createProject: (data) => request("/api/projects", { method: "POST", auth: true, body: data }),
  updateProject: (id, data) => request(`/api/projects/${id}`, { method: "PUT", auth: true, body: data }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: "DELETE", auth: true }),

  getServices: () => request("/api/services"),
  createService: (data) => request("/api/services", { method: "POST", auth: true, body: data }),
  updateService: (id, data) => request(`/api/services/${id}`, { method: "PUT", auth: true, body: data }),
  deleteService: (id) => request(`/api/services/${id}`, { method: "DELETE", auth: true }),

  sendMessage: (data) => request("/api/messages", { method: "POST", body: data }),
  getMessages: () => request("/api/messages", { auth: true }),
  markMessageRead: (id, isRead) => request(`/api/messages/${id}`, { method: "PATCH", auth: true, body: { is_read: isRead } }),
  deleteMessage: (id) => request(`/api/messages/${id}`, { method: "DELETE", auth: true }),

  uploadMedia: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/upload", { method: "POST", auth: true, body: form, isForm: true });
  },

  getSettings: () => request("/api/settings"),
  updateSettings: (data) => request("/api/settings", { method: "PUT", auth: true, body: data }),

  getTestimonials: () => request("/api/testimonials"),
  getAllTestimonials: () => request("/api/testimonials/all", { auth: true }),
  createTestimonial: (data) => request("/api/testimonials", { method: "POST", auth: true, body: data }),
  updateTestimonial: (id, data) => request(`/api/testimonials/${id}`, { method: "PUT", auth: true, body: data }),
  deleteTestimonial: (id) => request(`/api/testimonials/${id}`, { method: "DELETE", auth: true }),

  getPricing: () => request("/api/pricing"),
  createPricing: (data) => request("/api/pricing", { method: "POST", auth: true, body: data }),
  updatePricing: (id, data) => request(`/api/pricing/${id}`, { method: "PUT", auth: true, body: data }),
  deletePricing: (id) => request(`/api/pricing/${id}`, { method: "DELETE", auth: true }),

  getProcessSteps: () => request("/api/process-steps"),
  createProcessStep: (data) => request("/api/process-steps", { method: "POST", auth: true, body: data }),
  updateProcessStep: (id, data) => request(`/api/process-steps/${id}`, { method: "PUT", auth: true, body: data }),
  deleteProcessStep: (id) => request(`/api/process-steps/${id}`, { method: "DELETE", auth: true }),

  translateBatch: (texts) => request("/api/translate", { method: "POST", body: { texts } }).then((r) => r.translations),

  getFaqs: () => request("/api/faqs"),
  createFaq: (data) => request("/api/faqs", { method: "POST", auth: true, body: data }),
  updateFaq: (id, data) => request(`/api/faqs/${id}`, { method: "PUT", auth: true, body: data }),
  deleteFaq: (id) => request(`/api/faqs/${id}`, { method: "DELETE", auth: true }),

  subscribe: (email) => request("/api/subscribe", { method: "POST", body: { email } }),
  getSubscribers: () => request("/api/subscribers", { auth: true }),
  deleteSubscriber: (id) => request(`/api/subscribers/${id}`, { method: "DELETE", auth: true }),

  getProjectImages: (projectId) => request(`/api/project-images/${projectId}`),
  addProjectImage: (projectId, imageUrl) => request("/api/project-images", { method: "POST", auth: true, body: { project_id: projectId, image_url: imageUrl } }),
  updateProjectImage: (id, imageUrl) => request(`/api/project-images/${id}`, { method: "PUT", auth: true, body: { image_url: imageUrl } }),
  deleteProjectImage: (id) => request(`/api/project-images/${id}`, { method: "DELETE", auth: true }),

  track: (path, referrer) => request("/api/track", { method: "POST", body: { path, referrer } }).catch(() => {}),
  getAnalyticsSummary: () => request("/api/analytics/summary", { auth: true })
};

export { API_URL };
