import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "../components/Logo";

export const ForgotPassword = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialEmail = (location.state as { email?: string })?.email || searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo procesar la solicitud");
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al conectar con el servidor.");
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
          {!isSubmitted ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ingresa tu correo y te enviaremos las instrucciones para restablecerla de forma segura.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/15 text-secondary mb-3 animate-in zoom-in-75 duration-300">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight">
                ¡Revisa tu correo!
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Hemos enviado un correo a <strong className="text-dark dark:text-white font-bold">{email}</strong> con un enlace para crear una nueva clave.
              </p>
            </>
          )}
        </div>

        {!isSubmitted ? (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-900/50 flex items-start gap-2 animate-in fade-in">
                <span className="text-base leading-none">⚠️</span>
                <span>{error}</span>
              </div>
            )}

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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Enviando correo...</span>
                </>
              ) : (
                <>
                  <span>Enviar instrucciones</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Volver al inicio de sesión</span>
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 space-y-2">
              <p className="font-bold">¿Qué debes hacer ahora?</p>
              <ul className="list-disc list-inside space-y-1 text-emerald-700 dark:text-emerald-400">
                <li>Abre tu bandeja de entrada o carpeta de correo no deseado (spam).</li>
                <li>Haz clic en el enlace que te enviamos para crear tu nueva contraseña.</li>
                <li>El enlace tiene una validez de 1 hora por seguridad.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all"
              >
                <ArrowLeft size={16} />
                <span>Volver al inicio de sesión</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
