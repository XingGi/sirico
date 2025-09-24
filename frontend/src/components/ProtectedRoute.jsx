import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // Cek apakah token ada di localStorage
  const token = localStorage.getItem("sirico-token");

  // Jika ada token, tampilkan halaman yang diminta (melalui <Outlet />).
  // Jika tidak ada token, paksa arahkan ke halaman login.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
