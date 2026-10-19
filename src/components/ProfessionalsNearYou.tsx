import { BadgeCheck, Star, MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Oficio {
  id: number;
  nombre_oficio: string;
  descripcion_oficio?: string;
}

interface Professional {
  id: string;
  estado_validado: boolean;
  estado_auditoria: string;
  calificacion_promedio: number;
  ubicacion_geografica: string | null;
  latitud: number | null;
  longitud: number | null;
  descripcion_perfil: string | null;
  oficios: Oficio[];
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil: string | null;
  };
}

type ProfesionalConDistancia = Professional & { distanciaKm: number | null };

const calcularDistanciaKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const ProfessionalsNearYou = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [modoCercania, setModoCercania] = useState(false);
  useEffect(() => {
    const controller = new AbortController();

    const cargarProfesionales = async () => {
      setCargando(true);
      setError(null);
      try {
        const respuesta = await fetch(
          "http://localhost:3000/api/profesionales/public",
          { signal: controller.signal },
        );
        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar los profesionales");
        }
        const datos = await respuesta.json();
        setProfessionals(datos);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error al cargar profesionales:", err);
        setError(
          err instanceof Error ? err.message : "Ocurrió un error inesperado",
        );
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargarProfesionales();

    return () => controller.abort();
  }, []);

  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no soporta geolocalización.");
      return;
    }

    setBuscandoUbicacion(true);
    setErrorUbicacion(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacionUsuario({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setModoCercania(true);
        setBuscandoUbicacion(false);
      },
      (err) => {
        console.error("Error de geolocalización:", err);
        setErrorUbicacion(
          "No pudimos obtener tu ubicación. Mostrando todos los profesionales.",
        );
        setModoCercania(false);
        setBuscandoUbicacion(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  if (cargando) {
    return (
      <section className="px-4 py-8 max-w-4xl mx-auto w-full mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">
            Profesionales cerca de ti
          </h2>
          <a
            href="#"
            className="text-primary font-bold hover:underline hidden md:block"
          >
            Ver todos
          </a>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-8 max-w-4xl mx-auto w-full mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">
            Profesionales cerca de ti
          </h2>
          <a
            href="#"
            className="text-primary font-bold hover:underline hidden md:block"
          >
            Ver todos
          </a>
        </div>
        <div className="bg-red-50/20 border border-red-100 rounded-xl p-6 text-center text-red-400">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => {
              setCargando(true);
              setError(null);
              window.location.reload();
            }}
            className="mt-4 text-primary font-bold hover:underline text-sm"
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (professionals.length === 0) {
    return (
      <section className="px-4 py-8 max-w-4xl mx-auto w-full mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">
            Profesionales cerca de ti
          </h2>
          <a
            href="#"
            className="text-primary font-bold hover:underline hidden md:block"
          >
            Ver todos
          </a>
        </div>
        <div className="p-12 text-center">
          <p className="text-gray-400 font-medium">
            No hay profesionales disponibles por el momento.
          </p>
        </div>
      </section>
    );
  }

  const profesionalesConDistancia: ProfesionalConDistancia[] =
    professionals.map((pro) => {
      if (!ubicacionUsuario || pro.latitud == null || pro.longitud == null) {
        return { ...pro, distanciaKm: null };
      }
      return {
        ...pro,
        distanciaKm: calcularDistanciaKm(
          ubicacionUsuario.lat,
          ubicacionUsuario.lng,
          pro.latitud,
          pro.longitud,
        ),
      };
    });

  const profesionalesOrdenados = modoCercania
    ? [...profesionalesConDistancia].sort((a, b) => {
        if (a.distanciaKm == null) return 1;
        if (b.distanciaKm == null) return -1;
        return a.distanciaKm - b.distanciaKm;
      })
    : profesionalesConDistancia;

  return (
    <section className="px-4 py-8 max-w-4xl mx-auto w-full mb-12">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-dark dark:text-white transition-colors">
          Profesionales cerca de ti
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={
              modoCercania ? () => setModoCercania(false) : solicitarUbicacion
            }
            disabled={buscandoUbicacion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors border-gray-200 dark:border-gray-700 text-dark dark:text-gray-200 hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {buscandoUbicacion ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MapPin size={14} />
            )}
            {buscandoUbicacion
              ? "Ubicando..."
              : modoCercania
                ? "Ver todos"
                : "Cerca de mí"}
          </button>

          <a
            href="#"
            className="text-primary font-bold hover:underline hidden md:block"
          >
            Ver todos
          </a>
        </div>
        {errorUbicacion && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
            {errorUbicacion}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profesionalesOrdenados.map((pro) => {
          const nombre = `${pro.usuario.nombre} ${pro.usuario.apellido}`;
          const oficio = pro.oficios?.[0]?.nombre_oficio ?? "Profesional";
          const rating = Number(pro.calificacion_promedio) || 0;

          return (
            <div
              key={pro.id}
              className="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start gap-4 mb-4">
                {pro.usuario.foto_perfil ? (
                  <img
                    src={pro.usuario.foto_perfil}
                    alt={nombre}
                    className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-gray-100 dark:border-gray-700">
                    {pro.usuario.nombre?.[0] ?? "?"}
                    {pro.usuario.apellido?.[0] ?? ""}
                  </div>
                )}

                <div>
                  <h3 className="font-bold text-dark dark:text-white flex items-center gap-1">
                    {nombre}
                    {pro.estado_validado && (
                      <BadgeCheck
                        size={18}
                        className="text-success dark:text-success-dark"
                      />
                    )}
                  </h3>
                  <p className="text-sm text-dark/60 dark:text-gray-400 font-medium">
                    {oficio}
                  </p>

                  {rating > 0 ? (
                    <div className="flex items-center gap-1 mt-1 text-sm font-bold">
                      <Star
                        size={14}
                        className="text-warning fill-warning dark:text-warning-dark dark:fill-warning-dark"
                      />
                      <span className="text-dark dark:text-gray-200">
                        {rating.toFixed(1)}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-block mt-1 text-xs font-semibold text-secondary">
                      Nuevo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-dark/60 dark:text-gray-400 text-sm font-medium mb-6 mt-auto">
                <MapPin size={16} />
                <span>
                  {pro.ubicacion_geografica ?? "Ubicación no disponible"}
                  {pro.distanciaKm != null && (
                    <span className="text-secondary font-bold">
                      {" "}
                      · a {pro.distanciaKm.toFixed(1).replace(".", ",")} km
                    </span>
                  )}
                </span>
              </div>

              <button className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                Contratar
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center md:hidden">
        <a href="#" className="text-primary font-bold hover:underline">
          Ver todos los profesionales
        </a>
      </div>
    </section>
  );
};
