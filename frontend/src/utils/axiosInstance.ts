// src/utils/axiosInstance.ts
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem("refresh");

    if (
      error.response?.status === 401 &&
      error.response.data.code === "token_not_valid" &&
      refreshToken &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const response = await axios.post("http://localhost:8000/api/token/refresh/", {
          refresh: refreshToken,
        });

        localStorage.setItem("access", response.data.access);
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;
        originalRequest.headers["Authorization"] = `Bearer ${response.data.access}`;

        return axios(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed", refreshError);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
