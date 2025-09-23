import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

// Ini adalah 'interceptor', sebuah fungsi yang akan berjalan SEBELUM setiap request dikirim
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sirico-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
