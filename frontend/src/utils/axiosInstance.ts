import axios from "axios";

// 🔹 Auto-détection selon le domaine actuel
const isProd = window.location.hostname === "102.216.27.135";

const baseURL = isProd
  ? "http://102.216.27.135:8000/api" // ✅ backend public accessible sur Internet
  : "http://172.16.67.25:8000/api";  // ✅ backend interne (réseau bureau à distance)

const axiosInstance = axios.create({
  baseURL,
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

// ✅ Intercepteur : ajout du token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Gestion du refresh token
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
