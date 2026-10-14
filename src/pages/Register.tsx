import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

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
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const navigate = useNavigate();
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,50}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{8,15}$/;

  const esMayorDeEdad = (fechaStr: string): boolean => {
    if (!fechaStr) return false;
    const fechaNac = new Date(fechaStr);
    if (isNaN(fechaNac.getTime())) return false;
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return edad >= 18;
  };

  const isNombreValid = nameRegex.test(formData.nombre.trim());
  const isApellidoValid = nameRegex.test(formData.apellido.trim());
  const isEmailValid = emailRegex.test(formData.email.trim());
  const isTelefonoValid = phoneRegex.test(formData.telefono.trim());
  const isFechaValid = esMayorDeEdad(formData.fecha_nacimiento);
  const isPasswordValid =
    formData.password.length >= 6 && formData.password.length <= 64;

  const isFormValid =
    isNombreValid &&
    isApellidoValid &&
    isEmailValid &&
    isTelefonoValid &&
    isFechaValid &&
    isPasswordValid;

  const getInputClass = (isValid: boolean, valor: string) => {
    const base =
      "w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 text-gray-800 text-sm";
    if (!valor)
      return `${base} border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100`;
    if (isValid)
      return `${base} border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100`;
    return `${base} border-rose-500 bg-rose-50/20 focus:border-rose-600 focus:ring-2 focus:ring-rose-100`;
  };

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
      setRegistroExitoso(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      const soloNumeros = value.replace(/\D/g, "");
      setFormData({ ...formData, [name]: soloNumeros });
      return;
    }

    if (name === "nombre" || name === "apellido") {
      const soloLetras = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
      setFormData({ ...formData, [name]: soloLetras });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 from-primary/10 to-transparent">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-primary/5">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-orange-500 text-white font-black text-xl w-9 h-9 flex items-center justify-center rounded-lg shadow-sm">
              E
            </span>
            <span className="text-2xl font-black text-orange-500 tracking-tight">
              Experto<span className="text-slate-800">Ya!</span>
            </span>
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3.5 rounded-xl text-sm font-medium border border-rose-100 flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {registroExitoso && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
              <span>🎉 ¡Cuenta creada exitosamente!</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Te enviamos un <strong>correo de bienvenida</strong> con el diseño
              oficial de ExpertoYa a tu casilla. Redirigiendo a la pantalla de
              acceso...
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                required
                value={formData.nombre}
                onChange={handleChange}
                className={getInputClass(isNombreValid, formData.nombre)}
              />
              {formData.nombre && !isNombreValid && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  Solo letras (mínimo 2 caracteres)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                required
                value={formData.apellido}
                onChange={handleChange}
                className={getInputClass(isApellidoValid, formData.apellido)}
              />
              {formData.apellido && !isApellidoValid && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  Solo letras (mínimo 2 caracteres)
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.email && !isEmailValid && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  Formato inválido (ej. usuario@dominio.com)
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                required
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.telefono && !isTelefonoValid && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  Solo números (entre 8 y 15 dígitos)
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                required
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-gray-500"
              />
              {formData.fecha_nacimiento && !isFechaValid && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  Debes tener al menos 18 años
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {formData.password && !isPasswordValid && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Tipo de Cuenta
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="CLIENTE">
                  Quiero contratar servicios (Cliente)
                </option>
                <option value="PROFESIONAL">
                  Quiero ofrecer servicios (Profesional)
                </option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white transition-all shadow-md mt-4 ${
                isFormValid && !isLoading
                  ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/25 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed shadow-none"
              }`}
            >
              {isLoading ? "Creando cuenta..." : "Crear mi cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};;;
