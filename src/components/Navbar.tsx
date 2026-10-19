import { useState, useEffect } from "react";
import { Home, Search, MessageSquare, LogIn, LogOut, User as UserIcon, Sun, Moon } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("expertoya_theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return (
      document.documentElement.classList.contains("dark") ||
      Boolean(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    const favicon = document.getElementById("favicon-default") as HTMLLinkElement | null;
    if (isDark) {
      document.documentElement.classList.add("dark");
      if (favicon) favicon.href = "/favicon-dark.svg";
    } else {
      document.documentElement.classList.remove("dark");
      if (favicon) favicon.href = "/favicon-light.svg";
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mediaQuery) return;
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("expertoya_theme");
      if (!stored) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("expertoya_theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav className="hidden lg:flex items-center justify-between px-8 py-4 bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-300">
        <Link to="/" className="flex items-center shrink-0 hover:opacity-95 transition-opacity">
          <Logo className="h-9 w-auto" />
        </Link>

        <div className="flex items-center gap-8 font-bold text-dark/70 dark:text-gray-300 whitespace-nowrap">
          <Link
            to="/"
            className={location.pathname === "/" ? "text-primary" : "hover:text-primary transition-colors"}
          >
            Inicio
          </Link>
          <a href="#" className="hover:text-primary transition-colors">
            Profesionales
          </a>
          {user?.rol === "PROFESIONAL" && (
            <a href="#" className="hover:text-primary transition-colors">
              Panel Pro
            </a>
          )}
          <Link
            to="/chats"
            className={`transition-colors ${
              location.pathname === "/chats"
                ? "text-primary"
                : "hover:text-primary"
            }`}
          >
            Chats
          </Link>
          {user?.rol === "ADMIN" && (
            <Link to="/admin" className="hover:text-primary transition-colors">
              Panel Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Botón de cambio de tema Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            className="px-3 py-2 text-dark/70 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-gray-200 dark:border-gray-700 cursor-pointer"
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            title={isDark ? "Modo Claro" : "Modo Oscuro"}
          >
            {isDark ? (
              <>
                <Sun size={16} className="text-amber-500" />
                <span>Claro</span>
              </>
            ) : (
              <>
                <Moon size={16} className="text-dark" />
                <span>Oscuro</span>
              </>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300">
                  <UserIcon size={18} />
                </div>
                Hola, {user.nombre}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={18} />
                Salir
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="shrink-0 whitespace-nowrap px-6 py-2.5 bg-primary hover:opacity-90 transition-opacity text-white font-bold rounded-xl flex items-center gap-2 shadow-sm shadow-primary/20"
            >
              <LogIn size={18} />
              Iniciar Sesión
            </Link>
          )}
        </div>
      </nav>

      {/* Barra de navegación inferior Mobile */}
      <nav className="flex lg:hidden fixed bottom-0 w-full bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-gray-800 justify-around py-3 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${
            location.pathname === "/" ? "text-primary" : "text-dark/40 dark:text-gray-400 hover:text-dark dark:hover:text-white"
          }`}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold">Inicio</span>
        </Link>
        <a
          href="#"
          className="flex flex-col items-center gap-1 text-dark/40 dark:text-gray-400 hover:text-dark dark:hover:text-white transition-colors"
        >
          <Search size={24} />
          <span className="text-[10px] font-bold">Buscar</span>
        </a>
        <Link
          to="/chats"
          className={`flex flex-col items-center gap-1 ${
            location.pathname === "/chats" ? "text-primary" : "text-dark/40 dark:text-gray-400 hover:text-dark dark:hover:text-white"
          }`}
        >
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold">Chats</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 text-dark/40 dark:text-gray-400 hover:text-dark dark:hover:text-white transition-colors cursor-pointer"
        >
          {isDark ? <Sun size={24} className="text-amber-500" /> : <Moon size={24} />}
          <span className="text-[10px] font-bold">{isDark ? "Claro" : "Oscuro"}</span>
        </button>
      </nav>
    </>
  );
};
