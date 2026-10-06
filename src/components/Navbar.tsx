import { Home, Search, MessageSquare, Settings, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <nav className="hidden lg:flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            E
          </div>
          <span className="text-xl font-extrabold text-primary">
            Experto<span className="text-dark">Ya!</span>
          </span>
        </Link>

        <div className="flex items-center gap-8 font-bold text-dark/70 whitespace-nowrap">
          <Link to="/" className="text-primary">
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
          {user && (
            <a href="#" className="hover:text-primary transition-colors">
              Chats
            </a>
          )}
          {user?.rol === "ADMIN" && (
            <Link to="/admin" className="hover:text-primary transition-colors">
              Panel Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  <UserIcon size={18} />
                </div>
                Hola, {user.nombre}
              </span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
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
      <nav className="flex lg:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 justify-around py-3 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ">
        <a href="#" className="flex flex-col items-center gap-1 text-primary">
          <Home size={24} />
          <span className="text-[10px] font-bold">Inicio</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 text-dark/40 hover:text-dark transition-colors"
        >
          <Search size={24} />
          <span className="text-[10px] font-bold">Buscar</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 text-dark/40 hover:text-dark transition-colors"
        >
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold">Chats</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 text-dark/40 hover:text-dark transition-colors"
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold">Ajustes</span>
        </a>
      </nav>
    </>
  );
};
