import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("❌ VITE_API_URL is not defined");
}
console.log("API URL:", import.meta.env.VITE_API_URL);
const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access");
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
        const refresh = sessionStorage.getItem("refresh");

        if (!refresh) {
          throw new Error("No refresh token");
        }

        const res = await axios.post(`${API_BASE_URL}/api/token/refresh/`, {
          refresh,
        });

        const newAccess = res.data.access;

        // ✅ sauvegarder nouveau token
        sessionStorage.setItem("access", newAccess);
        
        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }

        // ✅ injecter dans la requête en cours (TRÈS IMPORTANT)
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

        // ✅ retry avec le bon token
        return axiosInstance(originalRequest);

      } catch (err) {
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
