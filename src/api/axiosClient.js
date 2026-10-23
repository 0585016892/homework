import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:12004/api",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("home_task_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cho phép gửi FormData để tải ảnh minh chứng.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    // Không tự chuyển hướng khi API đăng nhập trả về 401.
    if (
      status === 401 &&
      !requestUrl.includes("/auth/login") &&
      localStorage.getItem("home_task_token")
    ) {
      localStorage.removeItem("home_task_token");
      localStorage.removeItem("home_task_user");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
