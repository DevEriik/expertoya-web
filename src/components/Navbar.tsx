import { Home, Search, MessageSquare, Settings, LogIn } from "lucide-react";

export const Navbar = () => {
  return (
    <>
      <nav className="hidden lg:flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            E
          </div>
          <span className="text-xl font-extrabold text-primary">
            Experto<span className="text-dark">Ya!</span>
          </span>
        </div>

        <div className="flex items-center gap-8 font-bold text-dark/70 whitespace-nowrap">
          <a href="#" className="text-primary">
            Inicio
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Profesionales
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Panel Pro
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Chats
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Ajustes
          </a>
        </div>

        <button className=" shrink-0 whitespace-nowrap px-6 py-2.5 bg-primary hover:opacity-90 transition-opacity text-white font-bold rounded-xl flex items-center gap-2">
          <LogIn size={18} />
          Iniciar Sesión
        </button>
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
