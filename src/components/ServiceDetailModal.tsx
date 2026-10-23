import React, { useEffect } from "react";
import { X, Clock, Wrench, Pencil, Trash2 } from "lucide-react";
import type { ProfessionalService } from "../types/professional";

interface ServiceDetailModalProps {
  visible: boolean;
  service: ProfessionalService | null;
  onClose: () => void;
  onEditService?: (service: ProfessionalService) => void;
  onDeleteService?: (service: ProfessionalService) => void;
  onEdit?: (service: ProfessionalService) => void;
  onDelete?: (service: ProfessionalService) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  visible,
  service,
  onClose,
  onEditService,
  onDeleteService,
  onEdit,
  onDelete,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);
  const handleEdit = onEditService || onEdit;
  const handleDelete = onDeleteService || onDelete;

  useEffect(() => {
    setSelectedPhotoIndex(0);
  }, [service]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible || !service) return null;

  const isActivo = service.servicio_activo;
  const fotos = service.fotos_servicio || [];
  const currentPhoto = fotos[selectedPhotoIndex] || fotos[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl my-auto rounded-3xl overflow-hidden shadow-2xl transition-all
          bg-white dark:bg-dark-surface
          border border-slate-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-800 bg-slate-50/60 dark:bg-dark-bg/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-primary border border-amber-200/50 dark:border-amber-900/40 mb-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>{service.nombre_oficio || "Servicio Profesional"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Detalle del Servicio
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors
              bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700
              text-slate-600 dark:text-gray-300 cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Galería de imágenes si existen */}
          {fotos.length > 0 && (
            <div className="space-y-2">
              <div className="rounded-2xl overflow-hidden h-64 w-full bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                <img
                  src={currentPhoto}
                  alt={service.titulo_servicio}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              {fotos.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {fotos.map((f, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        selectedPhotoIndex === idx
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-slate-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={f}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Título y Estado */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
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
                <span>{isActivo ? "Servicio Activo" : "Servicio en Pausa"}</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {service.titulo_servicio}
            </h3>
          </div>

          {/* Tarjeta de Métricas: Precio y Tiempo */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-dark-bg border border-slate-200/80 dark:border-gray-800">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                Tarifa Estimada
              </span>
              <div className="text-2xl font-black text-primary">
                ${Number(service.costo_estimado).toLocaleString()}{" "}
                <span className="text-xs font-bold text-slate-400 dark:text-gray-400">ARS</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
                Tiempo Estimado
              </span>
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                <Clock className="w-5 h-5 text-primary" />
                <span>{service.duracion_estimada || "A convenir"}</span>
              </div>
            </div>
          </div>

          {/* Descripción Completa */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">
              Descripción Comercial del Servicio
            </h4>
            <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-gray-200 whitespace-pre-line bg-white dark:bg-dark-surface p-4 rounded-2xl border border-slate-200 dark:border-gray-800">
              {service.descripcion_servicio}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 border-t border-slate-100 dark:border-gray-800 bg-slate-50/60 dark:bg-dark-bg/40">
          {handleDelete && (
            <button
              type="button"
              onClick={() => {
                onClose();
                handleDelete(service);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border
                bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50
                text-red-500 dark:text-red-400 border-red-200 dark:border-red-900/60 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Servicio</span>
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {handleEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleEdit(service);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
                <span>Editar Servicio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;
