import React, { useEffect } from "react";
import { X } from "lucide-react";
import { ServiceFormWithAI } from "./ServiceFormWithAI";
import type { ServiceFormValues } from "./ServiceFormWithAI";
import type { ProfessionalService } from "../types/professional";

interface ServiceModalProps {
  visible: boolean;
  service?: ProfessionalService | null;
  onClose: () => void;
  onSave: (serviceData: Omit<ProfessionalService, "id"> & { id?: string }) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  visible,
  service,
  onClose,
  onSave,
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

  const isEditing = Boolean(service && service.id);

  const initialValues = service
    ? {
        titulo: service.titulo_servicio,
        categoria: service.nombre_oficio || "Plomería",
        precio: String(service.costo_estimado || ""),
        duracion: service.duracion_estimada || "",
        descripcion: service.descripcion_servicio || "",
        fotos: service.fotos_servicio || [],
      }
    : undefined;

  const handleSaveForm = (values: ServiceFormValues) => {
    const parsedPrice = parseFloat(values.precio.replace(/[^0-9.]/g, "")) || 0;
    onSave({
      id: service?.id,
      titulo_servicio: values.titulo,
      nombre_oficio: values.categoria,
      oficio_id: service?.oficio_id || 1,
      costo_estimado: parsedPrice,
      duracion_estimada: values.duracion || "A convenir",
      descripcion_servicio: values.descripcion,
      fotos_servicio: values.fotos && values.fotos.length > 0 ? values.fotos : service?.fotos_servicio || [],
      servicio_activo: service ? service.servicio_activo : true,
    });
  };

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
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors
            bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700
            text-slate-600 dark:text-gray-300 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-8">
          <ServiceFormWithAI
            isEditing={isEditing}
            initialValues={initialValues}
            onSave={handleSaveForm}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
