import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  console.log("Usuario actual: ", user);
  console.log("Rol del usuario: ", user?.rol);

  if (user?.rol.toUpperCase() !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
};
