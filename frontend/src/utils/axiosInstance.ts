import axios from "axios";

// 🔹 MODE DEV → TOUJOURS LOCAL
const isDev = import.meta.env.MODE === "development";

let baseURL = "";

if (isDev) {
  console.log("🔥 Mode DEV détecté → backend local utilisé");
  baseURL = "http://127.0.0.1:8000/api";
}
else {
  const host = window.location.hostname;

  if (host === "102.216.27.135") {
    baseURL = "http://102.216.27.135:8000/api"; // Production
  } 
  else if (host.startsWith("172.") || host.startsWith("192.")) {
    baseURL = "http://172.16.67.25:8000/api"; // Bureau
  }
  else {
    baseURL = "http://127.0.0.1:8000/api"; // fallback
  }
}

console.log("📌 BaseURL utilisée =", baseURL);

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
