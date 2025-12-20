import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("❌ VITE_API_URL is not defined");
}

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

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
          const res = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
            refresh,
          });
          localStorage.setItem("access", res.data.access);
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${res.data.access}`;
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
