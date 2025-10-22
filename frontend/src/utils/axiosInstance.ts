import axios from "axios";

const baseURL = "http://127.0.0.1:8000/api"; // adapte si besoin

const axiosInstance = axios.create({
  baseURL,
  timeout: 0, // ⬅️ pas de limite de temps (utile pour gros imports)
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Intercepteur : ajouter le token d’accès à chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Intercepteur : gérer l’expiration du token automatiquement
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // si le token a expiré et qu'on n'a pas déjà essayé de le rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (refreshToken) {
          const res = await axios.post(`${baseURL}/token/refresh/`, {
            refresh: refreshToken,
          });

          // Sauvegarde du nouveau token
          localStorage.setItem("access", res.data.access);
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${res.data.access}`;

          // Relancer la requête originale avec le nouveau token
          return axiosInstance(originalRequest);
        }
      } catch (err) {
        console.error("Échec du rafraîchissement du token :", err);
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
