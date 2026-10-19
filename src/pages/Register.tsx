import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "../components/Logo";

export const Register = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    fecha_nacimiento: "",
    rol: "CLIENTE",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al registrarse");

      navigate("/login");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Brand Logo outside card */}
      <div className="mb-6 sm:mb-8 text-center">
        <Link to="/" className="inline-flex items-center justify-center group hover:opacity-90 transition-opacity">
          <Logo className="h-12 sm:h-14 w-auto" />
        </Link>
      </div>

      <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-dark-surface p-8 sm:p-10 rounded-3xl shadow-xl shadow-primary/5 dark:shadow-none border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-dark dark:text-white tracking-tight">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3.5 rounded-xl text-sm font-semibold border border-red-200 dark:border-red-900/50 flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Nombre</label>
              <input type="text" name="nombre" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Apellido</label>
              <input type="text" name="apellido" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Correo Electrónico</label>
              <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Teléfono</label>
              <input type="tel" name="telefono" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Fecha de Nacimiento</label>
              <input type="date" name="fecha_nacimiento" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm dark:[color-scheme:dark] cursor-pointer" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Contraseña</label>
              <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-dark/80 dark:text-gray-200 mb-1">Tipo de Cuenta</label>
              <select name="rol" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-sm">
                <option value="CLIENTE">Quiero contratar servicios (Cliente)</option>
                <option value="PROFESIONAL">Quiero ofrecer servicios (Profesional)</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-md shadow-primary/20 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {isLoading ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
