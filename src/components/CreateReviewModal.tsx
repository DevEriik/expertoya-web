import React, { useState } from "react";
import {
  Star,
  X,
  Camera,
  AlertTriangle,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface CreateReviewModalProps {
  isOpen: boolean;
  solicitudId: string;
  profesionalNombre: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  isOpen,
  solicitudId,
  profesionalNombre,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuth();

  const [calificacion, setCalificacion] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comentario, setComentario] = useState<string>("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const calificacionTextos: Record<number, string> = {
    1: "Deficiente - No se cumplió lo convenido",
    2: "Regular - Hubo contratiempos",
    3: "Aceptable - Cumplió con lo pactado",
    4: "Muy bueno - Excelente predisposición",
    5: "Sobresaliente - ¡Trabajo impecable y recomendado!",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    if (fotos.length + filesArray.length > 2) {
      setErrorMsg("Solo se permite adjuntar hasta 2 fotos como evidencia.");
      return;
    }

    const newFiles = [...fotos, ...filesArray].slice(0, 2);
    setFotos(newFiles);
    setErrorMsg(null);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
  };

  const handleRemovePhoto = (index: number) => {
    const updatedFiles = fotos.filter((_, i) => i !== index);
    setFotos(updatedFiles);
    setPreviewUrls(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (calificacion < 1 || calificacion > 5) {
      setErrorMsg("Por favor selecciona una calificación de 1 a 5 estrellas.");
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("solicitudId", solicitudId);
      formData.append("calificacion", String(calificacion));
      if (comentario.trim()) {
        formData.append("comentario", comentario.trim());
      }
      fotos.forEach((foto) => {
        formData.append("fotos", foto);
      });

      const res = await fetch("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.detalle || data.error || "No se pudo registrar la reseña"
        );
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar la reseña.";
      setErrorMsg(msg);
    } finally {
      setEnviando(false);
    }
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : calificacion;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-dark-surface rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-black text-[#283593] dark:text-white">
              Calificar Servicio
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Profesional: <span className="font-bold text-[#FF8C00]">{profesionalNombre}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-slate-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selector de Estrellas Interactivo */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">
              ¿Cómo evaluarías el servicio recibido?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setCalificacion(star)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    size={36}
                    className={
                      star <= currentDisplayRating
                        ? "text-[#F59E0B] fill-[#F59E0B] transition-colors"
                        : "text-slate-200 dark:text-gray-700 hover:text-amber-300"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-[#F59E0B] mt-2">
              {calificacionTextos[currentDisplayRating]}
            </p>
          </div>

          {/* Campo de Comentario */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-300">
                Tu reseña sobre el trabajo
              </label>
              <span className="text-[11px] font-semibold text-[#00BFA5]">
                Opcional
              </span>
            </div>
            <textarea
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={500}
              placeholder="Cuéntanos detalles de la prolijidad, puntualidad y cumplimiento de lo presupuestado..."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-slate-50/50 dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1">
              {comentario.length}/500 caracteres
            </div>
          </div>

          {/* Adjuntar Fotos (Máximo 2) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-300">
                Fotos de evidencia
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Hasta 2 imágenes
              </span>
            </div>

            <div className="flex items-center gap-3">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {fotos.length < 2 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-[#00BFA5] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors bg-slate-50/50 dark:bg-dark-bg">
                  <Camera size={20} className="text-[#00BFA5]" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Subir foto
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Advertencia Closed-Loop */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              <strong className="font-bold">Garantía Closed-Loop:</strong> Las
              calificaciones son públicas y definitivas. Una vez publicadas, no
              pueden ser modificadas ni eliminadas para garantizar la transparencia.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#FF8C00] text-white hover:bg-[#E67E00] shadow-md shadow-[#FF8C00]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {enviando ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              <span>Publicar reseña</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

