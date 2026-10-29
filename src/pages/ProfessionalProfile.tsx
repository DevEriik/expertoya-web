import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  MapPin,
  Loader2,
  Clock,
  DollarSign,
  MessageSquare,
  UserCheck,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { ContactModal } from "../components/chat/ContactModal";
import type { Professional, ProfessionalService } from "../types/professional";

export const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profesional, setProfesional] = useState<Professional | null>(null);
  const [servicios, setServicios] = useState<ProfessionalService[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const [resProfesionales, resServicios] = await Promise.all([
          fetch("http://localhost:3000/api/profesionales/public", {
            signal: controller.signal,
          }),
          fetch(
            `http://localhost:3000/api/profesionales/public/${id}/services`,
            { signal: controller.signal },
          ),
        ]);

        if (!resProfesionales.ok) {
          throw new Error("No se pudo cargar el perfil del profesional");
        }

        const lista: Professional[] = await resProfesionales.json();
        setProfesional(lista.find((p) => p.id === id) ?? null);

        if (resServicios.ok) {
          const datos = await resServicios.json();
          setServicios(Array.isArray(datos) ? datos : []);
        } else {
          setServicios([]);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error al cargar el perfil:", err);
        setError(
          err instanceof Error ? err.message : "Ocurrió un error inesperado",
        );
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargar();
    window.scrollTo({ top: 0 });

    return () => controller.abort();
  }, [id]);

  const volver = (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-bold text-dark/70 dark:text-gray-300 hover:text-primary transition-colors mb-6"
    >
      <ArrowLeft size={18} />
      Volver
    </Link>
  );

  if (cargando) {
    return (
      <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg">
        <Navbar />
        <section className="px-4 py-8 max-w-4xl mx-auto w-full">
          {volver}
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg">
        <Navbar />
        <section className="px-4 py-8 max-w-4xl mx-auto w-full">
          {volver}
          <div className="bg-red-50/20 border border-red-100 rounded-xl p-6 text-center text-red-400">
            <p className="font-medium">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!profesional) {
    return (
      <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg">
        <Navbar />
        <section className="px-4 py-8 max-w-4xl mx-auto w-full">
          {volver}
          <div className="p-12 text-center">
            <p className="text-dark dark:text-gray-200 font-bold text-lg">
              No encontramos a este profesional.
            </p>
            <p className="text-dark/60 dark:text-gray-400 text-sm mt-1">
              Puede que ya no esté disponible.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const nombre = `${profesional.usuario.nombre} ${profesional.usuario.apellido}`;
  const rating = Number(profesional.calificacion_promedio) || 0;

  return (
    <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg transition-colors duration-200">
      <Navbar />
      <section className="px-4 py-8 max-w-4xl mx-auto w-full">
        {volver}

        <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {profesional.usuario.foto_perfil ? (
              <img
                src={profesional.usuario.foto_perfil}
                alt={nombre}
                className="w-24 h-24 rounded-full object-cover border border-gray-100 dark:border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center border border-gray-100 dark:border-gray-700">
                {profesional.usuario.nombre?.[0] ?? "?"}
                {profesional.usuario.apellido?.[0] ?? ""}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-dark dark:text-white flex items-center justify-center sm:justify-start gap-2">
                {nombre}
                {profesional.estado_validado && (
                  <BadgeCheck
                    size={22}
                    className="text-success dark:text-success-dark"
                  />
                )}
              </h1>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profesional.oficios.map((oficio) => (
                  <span
                    key={oficio.id}
                    className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold"
                  >
                    {oficio.nombre_oficio}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm font-medium text-dark/60 dark:text-gray-400">
                {rating > 0 ? (
                  <span className="flex items-center gap-1 font-bold text-dark dark:text-gray-200">
                    <Star
                      size={16}
                      className="text-warning fill-warning dark:text-warning-dark dark:fill-warning-dark"
                    />
                    {rating.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-secondary font-bold">Nuevo</span>
                )}

                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {profesional.ubicacion_geografica ??
                    "Ubicación no disponible"}
                </span>
              </div>
            </div>
          </div>

          {profesional.descripcion_perfil && (
            <p className="mt-6 text-dark/70 dark:text-gray-300 leading-relaxed">
              {profesional.descripcion_perfil}
            </p>
          )}

          {user?.id === profesional.usuario.id || user?.id === profesional.id ? (
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-xl border border-gray-200 dark:border-gray-700">
              <UserCheck size={18} />
              <span>Tu perfil profesional</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                setShowContactModal(true);
              }}
              className="mt-6 w-full sm:w-auto px-8 py-3 bg-[#FF8C00] text-white font-bold rounded-xl hover:bg-[#E67E00] shadow-md shadow-[#FF8C00]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare size={18} />
              <span>Contactar Profesional</span>
            </button>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-dark dark:text-white mb-4">
            Servicios publicados
          </h2>

          {servicios.length === 0 ? (
            <p className="text-dark/60 dark:text-gray-400 text-sm">
              Este profesional todavía no publicó servicios.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
                >
                  <h3 className="font-bold text-dark dark:text-white">
                    {servicio.titulo_servicio}
                  </h3>
                  <p className="text-sm text-dark/60 dark:text-gray-400 mt-1">
                    {servicio.descripcion_servicio}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-bold text-dark dark:text-gray-200">
                    <span className="flex items-center gap-1">
                      <DollarSign size={16} className="text-success" />$
                      {servicio.costo_estimado.toLocaleString("es-AR")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={16} className="text-secondary" />
                      {servicio.duracion_estimada}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {profesional && (
        <ContactModal
          isOpen={showContactModal}
          professionalId={profesional.id}
          professionalName={`${profesional.usuario.nombre} ${profesional.usuario.apellido}`}
          professionalPhoto={profesional.usuario.foto_perfil}
          profession={profesional.oficios?.[0]?.nombre_oficio}
          onClose={() => setShowContactModal(false)}
          onSuccess={(solicitudId) => {
            setShowContactModal(false);
            navigate(`/chats?chatId=${solicitudId}`);
          }}
        />
      )}
    </main>
  );
};
