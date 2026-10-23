import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  WifiOff,
  CheckCircle2,
  X,
  HelpCircle,
  Camera,
  UploadCloud,
  Trash2,
} from "lucide-react";

export interface ServiceFormValues {
  titulo: string;
  categoria: string;
  precio: string;
  duracion?: string;
  descripcion: string;
  fotos?: string[];
}

interface ServiceFormWithAIProps {
  initialValues?: Partial<ServiceFormValues>;
  isEditing?: boolean;
  onSave?: (data: ServiceFormValues) => void;
  onCancel?: () => void;
}

const CATEGORIAS_DISPONIBLES = [
  "Plomería",
  "Gasista Matriculado",
  "Electricidad",
  "Pintura y Terminaciones",
  "Cerrajería",
  "Refrigeración y Climatización",
  "Albañilería y Construcción",
  "Carpintería",
  "Jardinería",
];

export const ServiceFormWithAI: React.FC<ServiceFormWithAIProps> = ({
  initialValues,
  isEditing = false,
  onSave,
  onCancel,
}) => {
  const [titulo, setTitulo] = useState(initialValues?.titulo || "");
  const [categoria, setCategoria] = useState(
    initialValues?.categoria || CATEGORIAS_DISPONIBLES[0]
  );
  const [precio, setPrecio] = useState(initialValues?.precio || "");
  const [duracion, setDuracion] = useState(initialValues?.duracion || "1 a 2 horas");
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion || "");
  const [fotos, setFotos] = useState<string[]>(initialValues?.fotos || []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (errorMessage?.includes("conexión")) {
        setErrorMessage(null);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setErrorMessage(
        "El dispositivo ha perdido la conexión a internet. El asistente IA requiere una conexión activa."
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [errorMessage]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsGenerating(false);
    setElapsedSeconds(0);
    setErrorMessage("Se ha cancelado la solicitud de generación con IA.");
  };

  /**
   * Acción: Generar descripción comercial con IA
   * Incluye:
   * 1. Validación de red activa
   * 2. Timeout estricto de máx 10 segundos
   * 3. Manejo de estado de carga y loader
   * 4. Inyección en TextInput / Textarea editable sin guardado automático en BD
   * 5. Doble codificación para errores (Color semántico + Ícono de advertencia)
   */
  const handleGenerateAIDescription = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!navigator.onLine || !isOnline) {
      setErrorMessage(
        "Sin conexión a internet: Verifica tu conexión a la red antes de solicitar asistencia a la IA."
      );
      return;
    }

    if (!titulo.trim()) {
      setErrorMessage(
        "Por favor ingresa un título representativo del servicio antes de generar la descripción."
      );
      return;
    }

    if (!categoria.trim()) {
      setErrorMessage(
        "Por favor selecciona una categoría u oficio para orientar la propuesta."
      );
      return;
    }

    setIsGenerating(true);
    setElapsedSeconds(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);
    let seconds = 0;
    timerRef.current = setInterval(() => {
      seconds += 1;
      setElapsedSeconds(seconds);
    }, 1000);

    try {
      const apiUrl =
        (import.meta.env.VITE_API_URL || "http://localhost:3000") +
        "/api/ia/generate-description";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          precio: precio.trim(),
          categoria: categoria.trim(),
          descripcion_actual: descripcion.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (timerRef.current) clearInterval(timerRef.current);

      if (!response.ok) {
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
        } catch (parseErr) {
          console.warn("No se pudo parsear el error:", parseErr);
        }

        if (response.status === 400) {
          throw new Error(
            errorData.error ||
            "Los datos del servicio contienen términos no permitidos o incompletos."
          );
        } else if (response.status === 429) {
          throw new Error(
            "El servicio de IA se encuentra saturado. Por favor intenta en unos instantes."
          );
        } else {
          throw new Error(
            errorData.error ||
            "Ocurrió un error en el servidor de IA al redactar la propuesta comercial."
          );
        }
      }

      const data = await response.json();

      if (!data.descripcion || typeof data.descripcion !== "string") {
        throw new Error(
          "El asistente no pudo devolver una propuesta válida. Intenta nuevamente."
        );
      }

      setDescripcion(data.descripcion.trim());
      setSuccessNotice(
        "¡Propuesta comercial generada con éxito! Puedes revisarla y editarla libremente antes de guardar."
      );
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (timerRef.current) clearInterval(timerRef.current);

      if (err instanceof Error && err.name === "AbortError") {
        setErrorMessage(
          "Tiempo de espera agotado (límite de 10 segundos excedido). La IA no respondió a tiempo; intenta nuevamente."
        );
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Error de comunicación al intentar generar la descripción comercial.";
        setErrorMessage(msg);
      }
    } finally {
      setIsGenerating(false);
      setElapsedSeconds(0);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      setErrorMessage("El título del servicio es obligatorio.");
      return;
    }

    if (!precio.trim()) {
      setErrorMessage("Por favor indica una tarifa o precio de referencia.");
      return;
    }

    if (!descripcion.trim()) {
      setErrorMessage(
        "La descripción del servicio es obligatoria. Puedes redactarla tú o usar el Asistente IA."
      );
      return;
    }

    onSave?.({
      titulo: titulo.trim(),
      categoria: categoria.trim(),
      precio: precio.trim(),
      duracion: duracion.trim(),
      descripcion: descripcion.trim(),
      fotos,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - fotos.length;
    if (remainingSlots <= 0) {
      setErrorMessage("Solo puedes adjuntar hasta 5 fotos por servicio.");
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);
    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFotos((prev) => {
            if (prev.length >= 5) return prev;
            return [...prev, event.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 transition-colors duration-200 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#283593] dark:text-[#FDFCF4]">
            {isEditing ? "Editar Servicio" : "Publicar Nuevo Servicio"}
          </h2>
          <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
            Completa la información para ofrecer tu trabajo a miles de clientes en ExpertoYa.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 sm:p-8 shadow-xl border transition-colors duration-200
          bg-white dark:bg-[#1F2937]
          border-slate-200/80 dark:border-slate-700/60"
      >
        {errorMessage && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 p-4 rounded-xl flex items-start gap-3 transition-all duration-200
              bg-[#EF4444]/10 dark:bg-[#F87171]/15
              border border-[#EF4444] dark:border-[#F87171]
              text-[#EF4444] dark:text-[#F87171]"
          >
            <AlertTriangle
              className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#EF4444] dark:text-[#F87171]"
              aria-hidden="true"
            />
            <div className="flex-1 text-sm font-medium leading-relaxed">
              <span className="font-bold block mb-0.5">Atención requerida:</span>
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-[#EF4444] dark:text-[#F87171] hover:opacity-75 transition-opacity"
              aria-label="Cerrar mensaje de error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 p-4 rounded-xl flex items-start gap-3 transition-all duration-200
              bg-emerald-500/10 dark:bg-emerald-400/15
              border border-emerald-500 dark:border-emerald-400
              text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {successNotice}
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:opacity-75"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label
              htmlFor="titulo-servicio"
              className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#283593] dark:text-[#FDFCF4]"
            >
              Título del Servicio <span className="text-[#EF4444] dark:text-[#F87171]">*</span>
            </label>
            <input
              id="titulo-servicio"
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Instalación y reparación de termotanques y calderas"
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none font-medium
                bg-[#FDFCF4] dark:bg-[#121826]
                text-[#283593] dark:text-[#FDFCF4]
                border-slate-300 dark:border-slate-700
                focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="categoria-servicio"
                className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#283593] dark:text-[#FDFCF4]"
              >
                Categoría / Oficio <span className="text-[#EF4444] dark:text-[#F87171]">*</span>
              </label>
              <select
                id="categoria-servicio"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none font-medium
                  bg-[#FDFCF4] dark:bg-[#121826]
                  text-[#283593] dark:text-[#FDFCF4]
                  border-slate-300 dark:border-slate-700
                  focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:border-transparent"
              >
                {CATEGORIAS_DISPONIBLES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="precio-servicio"
                className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#283593] dark:text-[#FDFCF4]"
              >
                Precio de Referencia ($ARS) <span className="text-[#EF4444] dark:text-[#F87171]">*</span>
              </label>
              <input
                id="precio-servicio"
                type="text"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="Ej: 25000 o Presupuesto sin cargo"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none font-medium
                  bg-[#FDFCF4] dark:bg-[#121826]
                  text-[#283593] dark:text-[#FDFCF4]
                  border-slate-300 dark:border-slate-700
                  focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="duracion-servicio"
              className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#283593] dark:text-[#FDFCF4]"
            >
              Tiempo estimado de trabajo
            </label>
            <input
              id="duracion-servicio"
              type="text"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
              placeholder="Ej: 2 a 3 horas, Media jornada"
              className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none font-medium
                bg-[#FDFCF4] dark:bg-[#121826]
                text-[#283593] dark:text-[#FDFCF4]
                border-slate-300 dark:border-slate-700
                focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:border-transparent"
            />
          </div>

          <div className="pt-2">
            <div className="rounded-2xl p-5 border transition-all duration-200
              bg-[#FDFCF4]/60 dark:bg-[#121826]/70
              border-slate-200 dark:border-slate-700/80">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center
                    bg-[#00BFA5]/15 dark:bg-[#33EFA5]/20 text-[#00BFA5] dark:text-[#33EFA5]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#283593] dark:text-[#FDFCF4]">
                      Asistente IA para Redacción Comercial
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Redacta automáticamente una propuesta persuasiva basada en tu título y oficio.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-generar-descripcion-ia"
                  onClick={handleGenerateAIDescription}
                  disabled={isGenerating || !isOnline}
                  className={`relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-sm
                    border-2
                    border-[#00BFA5] text-[#283593] bg-[#FDFCF4] hover:bg-[#00BFA5]/10 active:scale-[0.98]
                    dark:border-[#33EFA5] dark:text-[#33EFA5] dark:bg-[#1F2937] dark:hover:bg-[#33EFA5]/15
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100`}
                  aria-label="Generar descripción comercial con Asistente IA"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#00BFA5] dark:text-[#33EFA5]" />
                      <span>Generando con IA ({elapsedSeconds}s / 10s)...</span>
                    </>
                  ) : !isOnline ? (
                    <>
                      <WifiOff className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>Sin conexión (IA no disponible)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#FF8C00] dark:text-[#FFB74D]" />
                      <span>Generar descripción con IA</span>
                    </>
                  )}
                </button>
              </div>

              {isGenerating && elapsedSeconds >= 2 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Consultando modelo de IA (máximo 10 segundos de espera)...
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:underline"
                  >
                    Cancelar solicitud
                  </button>
                </div>
              )}

              <div className="mt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <label
                    htmlFor="descripcion-servicio"
                    className="text-xs font-bold uppercase tracking-wider text-[#283593] dark:text-[#FDFCF4]"
                  >
                    Descripción del Servicio (Editable por el profesional){" "}
                    <span className="text-[#EF4444] dark:text-[#F87171]">*</span>
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {descripcion.length} caracteres
                  </span>
                </div>

                <textarea
                  id="descripcion-servicio"
                  rows={5}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Aquí aparecerá el texto generado por la IA o puedes escribir tu propia descripción comercial. Podrás editarla libremente en cualquier momento."
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none leading-relaxed font-normal
                    bg-white dark:bg-[#121826]
                    text-[#283593] dark:text-[#FDFCF4]
                    border-slate-300 dark:border-slate-700
                    focus:ring-2 focus:ring-[#00BFA5] dark:focus:ring-[#33EFA5] focus:border-transparent"
                />

                <p className="mt-2 text-xs flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    El texto sugerido por la IA se inyecta aquí para que lo adaptes a tu estilo antes de publicar.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Fotografías del Servicio (Máx 5) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#283593] dark:text-[#FDFCF4] flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-primary" />
                <span>Fotografías del Servicio ({fotos.length}/5)</span>
              </label>
              {fotos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Adjuntar Foto</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {fotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-2">
                {fotos.map((imgUri, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden aspect-square border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 shadow-sm"
                  >
                    <img
                      src={imgUri}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-black/60 text-white backdrop-blur-sm">
                      {idx === 0 ? "Principal" : `#${idx + 1}`}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {fotos.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex flex-col items-center justify-center p-3 text-slate-400 hover:text-primary transition-all aspect-square cursor-pointer bg-slate-50/50 dark:bg-dark-bg/50"
                  >
                    <UploadCloud className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">Agregar</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary p-6 text-center cursor-pointer transition-colors bg-white dark:bg-dark-surface flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400 mb-2">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-0.5">
                  Haz clic para adjuntar fotos demostrativas de tu trabajo
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Puedes subir hasta 5 fotos en formato JPG o PNG. La primera foto será la portada.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm transition-colors
                text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-200 shadow-md
              bg-[#FF8C00] hover:bg-[#FF8C00]/90 active:scale-[0.98]
              dark:bg-[#FF8C00] dark:hover:bg-[#FFB74D] dark:text-[#121826]"
          >
            {isEditing ? "Guardar Cambios" : "Publicar Servicio en ExpertoYa"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceFormWithAI;
