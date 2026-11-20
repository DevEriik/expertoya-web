export const API_URL = (
  import.meta.env.VITE_API_URL || "https://expertoya-backend.onrender.com"
)
  .trim()
  .replace(/\/+$/, "");
