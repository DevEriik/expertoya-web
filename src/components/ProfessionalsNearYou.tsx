import { MapPin, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProfessionalCard } from "./ProfessionalCard";
import type {
  Professional,
  ProfessionalWithDistance,
} from "../types/professional";

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
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

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

  const profesionalesConDistancia: ProfessionalWithDistance[] =
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
      </div>

      {errorUbicacion && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
          {errorUbicacion}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profesionalesOrdenados.map((pro) => (
          <ProfessionalCard key={pro.id} profesional={pro} />
        ))}
      </div>

      <div className="mt-6 text-center md:hidden">
        <a href="#" className="text-primary font-bold hover:underline">
          Ver todos los profesionales
        </a>
      </div>
    </section>
  );
};
