import React, { useEffect } from "react";
import { Trash2, Briefcase, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  visible: boolean;
  serviceTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  serviceTitle,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, isDeleting, onCancel]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isDeleting) onCancel();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center text-center transition-all
          bg-white dark:bg-dark-surface
          border border-slate-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícono de peligro */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-100 dark:bg-red-950/40 text-red-500">
          <Trash2 className="w-8 h-8" />
        </div>

        {/* Título */}
        <h2
          id="confirm-delete-title"
          className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-dark-text tracking-tight mb-2"
        >
          ¿Eliminar servicio?
        </h2>

        {/* Subtítulo / Nombre del servicio */}
        {Boolean(serviceTitle) && (
          <div className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border mb-3 bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gray-200">
            <Briefcase className="w-4 h-4 text-slate-500 dark:text-gray-400 shrink-0" />
            <span className="text-sm font-bold truncate">"{serviceTitle}"</span>
          </div>
        )}

        {/* Mensaje descriptivo */}
        <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300 mb-6 px-2">
          Esta acción es permanente y no se puede deshacer. El servicio dejará de
          estar disponible para contratación en la plataforma.
        </p>

        {/* Botones de acción */}
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-colors
              bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700
              text-slate-700 dark:text-gray-200 disabled:opacity-60 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 text-white
              bg-red-500 hover:bg-red-600 active:scale-[0.98] shadow-lg shadow-red-500/30
              disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
