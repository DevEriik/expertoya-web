import React, { useEffect } from "react";
import {
  X,
  BadgeCheck,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { ProfessionalService } from "../types/professional";

interface ProfilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  nombre: string;
  apellido: string;
  fotoPerfil?: string;
  bio?: string;
  zonasCobertura?: string;
  trade?: string;
  calificacion?: number;
  totalReviews?: number;
  servicios: ProfessionalService[];
}

export const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  visible,
  onClose,
  nombre,
  apellido,
  fotoPerfil,
  bio,
  zonasCobertura,
  trade = "Profesional Certificado",
  calificacion = 4.9,
  totalReviews = 310,
  servicios,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  const nombreCompleto = `${nombre} ${apellido}`.trim() || "Profesional";
  const activeServices = servicios.filter((s) => s.servicio_activo);

  const avatarUrl =
    fotoPerfil ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto rounded-3xl overflow-hidden shadow-2xl transition-all
          bg-white dark:bg-dark-surface
          border border-slate-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner con botón de cierre y chip de vista previa */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-primary to-orange-600">
          <img
            src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop"
            alt="Banner profesional"
            className="w-full h-full object-cover mix-blend-overlay opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-black/50 text-white backdrop-blur-md border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Previsualización (Vista del Cliente)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors
              bg-black/40 hover:bg-black/60 text-white backdrop-blur-md cursor-pointer border border-white/20"
            aria-label="Cerrar previsualización"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Header */}
        <div className="relative px-6 sm:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={nombreCompleto}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-dark-surface shadow-xl"
              />
              <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-surface flex items-center justify-center text-white">
                <BadgeCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Garantía ExpertoYa Activa</span>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {nombreCompleto}
              </h2>
              <div className="inline-flex items-center gap-1 text-sm font-black text-amber-500 justify-center sm:justify-start">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{calificacion.toFixed(1)}</span>
                <span className="text-xs text-slate-400 font-semibold">
                  ({totalReviews} opiniones)
                </span>
              </div>
            </div>

            <p className="text-sm font-bold text-primary">{trade}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{zonasCobertura || "Buenos Aires, CABA y GBA"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Responde en menos de 15 minutos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Details */}
        <div className="p-6 sm:p-8 pt-0 space-y-6 max-h-[50vh] overflow-y-auto">
          {/* Biografía */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-200/80 dark:border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">
              Acerca del Profesional
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-200 whitespace-pre-line">
              {bio ||
                "Profesional comprometido con la excelencia, puntualidad y satisfacción en cada trabajo realizado bajo estrictas normas de seguridad."}
            </p>
          </div>

          {/* Servicios Ofrecidos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary">
                Servicios Disponibles ({activeServices.length})
              </h3>
            </div>

            {activeServices.length === 0 ? (
              <div className="p-6 text-center text-sm font-medium text-slate-400 border border-dashed rounded-2xl">
                Aún no has publicado servicios activos.
              </div>
            ) : (
              <div className="space-y-3">
                {activeServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-dark-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-primary border border-amber-200/40">
                          {srv.nombre_oficio || "Oficio"}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {srv.titulo_servicio}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2">
                        {srv.descripcion_servicio}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-gray-800">
                      <div className="text-right">
                        <div className="text-base font-black text-primary">
                          ${Number(srv.costo_estimado).toLocaleString()} ARS
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{srv.duracion_estimada || "A convenir"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-gray-800 bg-slate-50/60 dark:bg-dark-bg/40">
          <p className="text-xs text-slate-400 dark:text-gray-500">
            Los clientes pueden contactarte y contratar directamente estos servicios.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewModal;
