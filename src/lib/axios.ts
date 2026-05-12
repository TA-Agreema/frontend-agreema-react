import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      switch (status) {
        case 401:
          localStorage.clear();
          window.location.href = "/login";
          break;

        case 403:
          window.location.href = "/unauthorized";
          break;

        case 404:
          console.error("Resource not found");
          break;

        case 500:
        case 502:
        case 503:
          window.location.href = "/server-error";
          break;

        default:
          console.error("API Error:", error.response.data);
      }
    } else if (error.request) {
      console.error("Network Error:", error.message);
      window.location.href = "/server-error";
    }

    return Promise.reject(error);
  },
);

export default api;
