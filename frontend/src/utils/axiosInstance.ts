import axios from "axios";

// 🔹 Détection automatique de l'environnement
const host = window.location.hostname;

let baseURL = "";

if (host === "102.216.27.135") {
  // 🌍 Production (serveur public)
  baseURL = "http://102.216.27.135:8000/api";
} else if (host.startsWith("172.") || host.startsWith("192.")) {
  // 🏢 Réseau interne (bureau à distance)
  baseURL = "http://172.16.67.25:8000/api";
} else {
  // 💻 Machine locale
  baseURL = "http://127.0.0.1:8000/api";
}

const axiosInstance = axios.create({
  baseURL,
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

// ✅ Intercepteurs inchangés
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem("refresh");
        if (refresh) {
          const res = await axios.post(`${baseURL}/token/refresh/`, { refresh });
          localStorage.setItem("access", res.data.access);
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;
          return axiosInstance(originalRequest);
        }
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
