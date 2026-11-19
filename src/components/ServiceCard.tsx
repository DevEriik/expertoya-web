import React from "react";
import { Wrench, Clock, Pencil, Pause, Play, Trash2 } from "lucide-react";
import type { ProfessionalService } from "../types/professional";

export interface ServiceCardProps {
  service: ProfessionalService;
  onPress?: (service: ProfessionalService) => void;
  onEdit?: (service: ProfessionalService) => void;
  onTogglePause?: (service: ProfessionalService) => void;
  onDelete?: (service: ProfessionalService) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onEdit,
  onTogglePause,
  onDelete,
}) => {
  const isActivo = service.servicio_activo;
  const fotos = service.fotos_servicio || [];
  const primaryImage = fotos.length > 0 ? fotos[0] : null;

  return (
    <div
      onClick={() => onPress && onPress(service)}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between
        bg-white dark:bg-dark-surface
        border-slate-200 dark:border-gray-800
        hover:shadow-lg hover:border-slate-300 dark:hover:border-gray-700
        ${onPress ? "cursor-pointer" : ""}
        ${isActivo ? "opacity-100" : "opacity-90"}
      `}
    >
      <div className="p-5 flex-1">
        {/* Top Header: Categoría y Estado Accesible */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-primary border border-amber-200/50 dark:border-amber-900/40">
            <Wrench className="w-3.5 h-3.5" />
            <span>{service.nombre_oficio || "Oficio"}</span>
          </div>

          {/* Badge de estado accesible */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              isActivo
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isActivo ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{isActivo ? "Activo" : "En pausa"}</span>
          </div>
        </div>

        {/* Título */}
        {primaryImage && (
          <div className="mb-3 rounded-xl overflow-hidden h-36 w-full bg-slate-100 dark:bg-gray-800">
            <img
              src={primaryImage}
              alt={service.titulo_servicio}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
        <h3 className="text-base sm:text-lg font-bold text-dark dark:text-dark-text tracking-tight mb-2 leading-snug">
          {service.titulo_servicio}
        </h3>

        {/* Descripción */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-4">
          {service.descripcion_servicio || "Sin descripción proporcionada."}
        </p>

        {/* Detalles: Duración y Precio */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-800 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 font-medium">
            <Clock className="w-4 h-4 text-slate-400 dark:text-gray-500" />
            <span>{service.duracion_estimada || "A convenir"}</span>
          </div>

          <div className="flex items-center gap-1 font-black text-primary text-base sm:text-lg">
            <span>${Number(service.costo_estimado).toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400 dark:text-gray-400">ARS</span>
          </div>
        </div>
      </div>

      {/* Action Bar: Editar, Pausar/Reanudar y Eliminar */}
      {(onEdit || onTogglePause || onDelete) && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 p-3 bg-slate-50/80 dark:bg-dark-bg/60 border-t border-slate-100 dark:border-gray-800"
        >
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(service)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors
                border border-slate-200 dark:border-gray-700 bg-white dark:bg-dark-surface
                text-dark dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer"
              aria-label="Editar este servicio"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          )}

          {onTogglePause && (
            <button
              type="button"
              onClick={() => onTogglePause(service)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                isActivo
                  ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                  : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
              }`}
              aria-label={isActivo ? "Pausar servicio" : "Activar servicio"}
            >
              {isActivo ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Activar</span>
                </>
              )}
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(service)}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-colors border
                bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50
                text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/60 cursor-pointer"
              aria-label="Eliminar este servicio"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Eliminar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceCard;
