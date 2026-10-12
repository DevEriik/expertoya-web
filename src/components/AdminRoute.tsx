import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-dark/60 font-semibold">Cargando verificación de administrador...</div>;
  }

  if (!user || !token || user.rol?.toUpperCase() !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return children;
};
