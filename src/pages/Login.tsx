import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "../components/Logo";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, plataforma: "WEB" }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Error al iniciar sesión");

      login(data.token, data.usuario);
      if (data.usuario.rol === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-background dark:bg-dark-bg transition-colors duration-300 relative py-12">
      {/* Brand Logo outside card */}
      <div className="mb-6 sm:mb-8 text-center">
        <Link to="/" className="inline-flex items-center justify-center group hover:opacity-90 transition-opacity">
          <Logo className="h-12 sm:h-14 w-auto" />
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white dark:bg-dark-surface p-8 sm:p-10 rounded-3xl shadow-xl shadow-primary/5 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-900/50 flex items-start gap-2 animate-in fade-in">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  className="rounded-xl block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-dark/80 dark:text-gray-200">
                  Contraseña
                </label>
                <Link
                  to="/forgot-password"
                  state={{ email }}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  className="rounded-xl block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a mi cuenta</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
