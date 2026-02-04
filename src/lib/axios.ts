import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - attach token
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
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle different error status codes
        if (error.response) {
            const status = error.response.status;

            switch (status) {
                case 401:
                    // Unauthorized - clear auth and redirect to login
                    localStorage.clear();
                    window.location.href = "/login";
                    break;

                case 403:
                    // Forbidden - redirect to unauthorized page
                    window.location.href = "/unauthorized";
                    break;

                case 404:
                    // Not found - could show a toast or redirect
                    console.error("Resource not found");
                    break;

                case 500:
                case 502:
                case 503:
                    // Server errors - redirect to server error page
                    window.location.href = "/server-error";
                    break;

                default:
                    console.error("API Error:", error.response.data);
            }
        } else if (error.request) {
            // Network error - no response received
            console.error("Network Error:", error.message);
            window.location.href = "/server-error";
        }

        return Promise.reject(error);
    }
);

export default api;
