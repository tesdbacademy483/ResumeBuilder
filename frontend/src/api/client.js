import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({ baseURL });

export const tokens = {
  get access() { return localStorage.getItem("access"); },
  get refresh() { return localStorage.getItem("refresh"); },
  set({ access, refresh }) {
    if (access) localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
  },
  clear() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
};

// Attach the access token to every request
api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// When the access token expires (401), refresh it once and retry the request
let refreshPromise = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("auth/login") || original?.url?.includes("auth/refresh");
    if (error.response?.status === 401 && !original._retry && !isAuthCall && tokens.refresh) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || axios.post(`${baseURL}/auth/refresh/`, { refresh: tokens.refresh });
        const { data } = await refreshPromise;
        tokens.set(data);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        tokens.clear();
        window.dispatchEvent(new Event("auth:logout"));
      } finally {
        refreshPromise = null;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
