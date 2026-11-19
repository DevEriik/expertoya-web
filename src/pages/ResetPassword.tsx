import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, KeyRound, Check, X } from "lucide-react";
import { Logo } from "../components/Logo";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Validaciones del cliente
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isValid = hasMinLength && hasNumber && passwordsMatch && Boolean(token.trim());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isSuccess && redirectCountdown === 0) {
      navigate("/login");
    }
    return () => clearTimeout(timer);
  }, [isSuccess, redirectCountdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Por favor ingresa o proporciona el token de recuperación.");
      return;
    }
    if (!hasMinLength) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!hasNumber) {
      setError("La contraseña debe incluir al menos un número.");
      return;
    }
    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo restablecer la contraseña");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al procesar la solicitud.");
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
          {!isSuccess ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight">
                Nueva Contraseña
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ingresa y confirma tu nueva clave para recuperar el acceso a tu cuenta.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/15 text-secondary mb-3 animate-in zoom-in-75 duration-300">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight">
                ¡Contraseña Actualizada!
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Tu contraseña ha sido modificada con éxito. Serás redirigido al inicio de sesión en{" "}
                <strong className="text-primary font-extrabold">{redirectCountdown}s</strong>...
              </p>
            </>
          )}
        </div>

        {!isSuccess ? (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-900/50 flex items-start gap-2 animate-in fade-in">
                <span className="text-base leading-none">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {!tokenFromUrl && (
              <div>
                <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1.5">
                  Token o Código de Recuperación
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="rounded-xl block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-mono text-xs"
                    placeholder="Pega el token recibido por correo"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1.5">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="rounded-xl block w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1.5">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="rounded-xl block w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checklist de requisitos de seguridad */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-2 text-xs">
              <span className="font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Requisitos de seguridad:
              </span>
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <Check size={14} className="text-secondary stroke-[3]" />
                ) : (
                  <X size={14} className="text-gray-400" />
                )}
                <span className={hasMinLength ? "text-secondary font-bold" : "text-gray-500 dark:text-gray-400"}>
                  Mínimo 8 caracteres
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasNumber ? (
                  <Check size={14} className="text-secondary stroke-[3]" />
                ) : (
                  <X size={14} className="text-gray-400" />
                )}
                <span className={hasNumber ? "text-secondary font-bold" : "text-gray-500 dark:text-gray-400"}>
                  Al menos un número
                </span>
              </div>
              <div className="flex items-center gap-2">
                {passwordsMatch ? (
                  <Check size={14} className="text-secondary stroke-[3]" />
                ) : (
                  <X size={14} className="text-gray-400" />
                )}
                <span className={passwordsMatch ? "text-secondary font-bold" : "text-gray-500 dark:text-gray-400"}>
                  Las contraseñas coinciden
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Actualizando contraseña...</span>
                </>
              ) : (
                <>
                  <span>Guardar nueva contraseña</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <span>Ir al inicio de sesión ahora</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
