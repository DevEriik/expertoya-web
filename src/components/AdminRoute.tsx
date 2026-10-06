import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const isAdmin = localStorage.getItem("rol") === "ADMIN";

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};
