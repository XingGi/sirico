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

// Interceptor untuk MENANGANI error dari setiap response
apiClient.interceptors.response.use(
  // Fungsi pertama: dijalankan jika response SUKSES (status 2xx)
  (response) => {
    // Cukup kembalikan response seperti biasa
    return response;
  },
  // Fungsi kedua: dijalankan jika response GAGAL
  (error) => {
    // Cek jika error memiliki response dari server
    if (error.response) {
      // Cek jika status error adalah 401 (Unauthorized) atau 422 (Token tidak valid/kedaluwarsa)
      if (error.response.status === 401 || error.response.status === 422) {
        console.log("Token tidak valid atau kedaluwarsa. Melakukan logout...");
        // Hapus token yang tidak valid dari penyimpanan
        localStorage.removeItem("sirico-token");
        // Arahkan paksa pengguna ke halaman login
        window.location.href = "/";
      }
    }
    // Kembalikan error agar bisa ditangani oleh komponen jika perlu (selain error 401/422)
    return Promise.reject(error);
  }
);

export default apiClient;
