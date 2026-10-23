import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Briefcase,
  FileText,
  Upload,
  Trash2,
  PauseCircle,
  PlayCircle,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import type { OficioItem, DiaSemanaItem } from "../utils/profileConstants";
import {
  OFICIOS_CATALOGO,
  ZONAS_SUGERIDAS,
  DIAS_SEMANA_DEFAULT,
  isLicenseRequired,
  mapBackendOficiosToIds,
} from "../utils/profileConstants";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
  initialData: {
    nombre: string;
    apellido: string;
    telefono: string;
    ubicacion_geografica: string;
    descripcion_perfil: string;
    disponible: boolean;
    oficios?: Array<{ id: number; nombre_oficio?: string; nombre?: string }>;
    oficios_pendientes_ids?: number[];
    matricula_documento?: string | null;
  };
}

interface EditProfileFormContentProps {
  onClose: () => void;
  onProfileUpdated: () => void;
  initialData: EditProfileModalProps["initialData"];
}

const EditProfileFormContent: React.FC<EditProfileFormContentProps> = ({
  onClose,
  onProfileUpdated,
  initialData,
}) => {
  // Datos personales y básicos inicializados en mount (sin cascading renders)
  const [nombre, setNombre] = useState(initialData.nombre || "");
  const [apellido, setApellido] = useState(initialData.apellido || "");
  const [telefono, setTelefono] = useState(initialData.telefono || "");
  const [zonas, setZonas] = useState(initialData.ubicacion_geografica || "");
  const [bio, setBio] = useState(initialData.descripcion_perfil || "");

  // Estado de pausa del perfil (si pausado: disponible = false)
  const [isPaused, setIsPaused] = useState(initialData.disponible === false);

  // Oficios y matrícula
  const [oficiosList, setOficiosList] = useState<OficioItem[]>(OFICIOS_CATALOGO);
  const initialParsedIds = useMemo(
    () => mapBackendOficiosToIds(initialData.oficios || [], OFICIOS_CATALOGO),
    [initialData.oficios]
  );
  const [selectedOficios, setSelectedOficios] = useState<number[]>(initialParsedIds);
  const [originalOficios] = useState<number[]>(initialParsedIds);
  const [pendingOficiosIds] = useState<number[]>(
    initialData.oficios_pendientes_ids || []
  );
  const [attachedDoc, setAttachedDoc] = useState<File | null>(null);
  const [existingMatriculaUrl] = useState<string | null>(
    initialData.matricula_documento || null
  );

  // Franja horaria de atención
  const [dias, setDias] = useState<DiaSemanaItem[]>(DIAS_SEMANA_DEFAULT);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Estados generales de guardado y feedback
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carga de disponibilidad del profesional
  const fetchAvailability = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiBase}/api/professionals/availability`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const dataDispo = await res.json();
        if (Array.isArray(dataDispo) && dataDispo.length > 0) {
          setDias((prev) =>
            prev.map((dia) => {
              const match = dataDispo.find(
                (d: { dia_semana: number; hora_inicio?: string; hora_fin?: string }) =>
                  Number(d.dia_semana) === dia.dia_semana
              );
              if (match) {
                return {
                  ...dia,
                  activo: true,
                  hora_inicio: match.hora_inicio || dia.hora_inicio,
                  hora_fin: match.hora_fin || dia.hora_fin,
                };
              }
              return { ...dia, activo: false };
            })
          );
        }
      }
    } catch (err: unknown) {
      console.warn("No se pudo cargar disponibilidad:", err);
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  // Cargar catálogo y disponibilidad al montar de forma asíncrona
  useEffect(() => {
    const initData = async () => {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      try {
        const resOficios = await fetch(`${apiBase}/api/professionals/oficios`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (resOficios.ok) {
          const dataOficios = await resOficios.json();
          if (Array.isArray(dataOficios) && dataOficios.length > 0) {
            const merged: OficioItem[] = dataOficios.map(
              (o: { id: number; nombre_oficio?: string; nombre?: string; descripcion_oficio?: string }) => {
                const fallback = OFICIOS_CATALOGO.find((c) => c.id === Number(o.id));
                return {
                  id: Number(o.id),
                  nombre: o.nombre_oficio || o.nombre || fallback?.nombre || `Oficio ${o.id}`,
                  nombre_oficio: o.nombre_oficio,
                  descripcion_oficio: o.descripcion_oficio,
                  requiresLicense: fallback ? fallback.requiresLicense : isLicenseRequired(o as unknown as OficioItem),
                  licenseAuthority: fallback?.licenseAuthority,
                };
              }
            );
            setOficiosList(merged);
          }
        }
      } catch (err: unknown) {
        console.warn("No se pudo cargar catálogo de oficios:", err);
      }

      await fetchAvailability();
    };

    void initData();
  }, [fetchAvailability]);

  // Detectar oficios nuevos seleccionados que requieren matrícula habilitante
  const newOficiosRequiringLicense = useMemo(() => {
    return selectedOficios.filter((id) => {
      const isNew = !originalOficios.includes(id);
      const info = oficiosList.find((o) => o.id === id);
      return isNew && isLicenseRequired(info);
    });
  }, [selectedOficios, originalOficios, oficiosList]);

  // Si hay nuevos oficios que exigen matrícula y no se adjuntó aún documento
  const requiresLicenseDocUpload =
    newOficiosRequiringLicense.length > 0 &&
    !attachedDoc &&
    !existingMatriculaUrl;

  // Toggle de un oficio en el catálogo
  const handleToggleOficio = (oficioId: number) => {
    const isCurrentlySelected = selectedOficios.includes(oficioId);

    if (isCurrentlySelected) {
      setSelectedOficios((prev) => prev.filter((id) => id !== oficioId));
      return;
    }

    setSelectedOficios((prev) => [...prev, oficioId]);
  };

  // Manejo de zonas de cobertura con chips de sugerencia rápida
  const handleAddZona = (zona: string) => {
    const trimmed = zonas.trim();
    const currentZones = trimmed
      ? trimmed.split(",").map((z) => z.trim().toLowerCase())
      : [];

    if (!currentZones.includes(zona.toLowerCase())) {
      setZonas(trimmed ? `${trimmed}, ${zona}` : zona);
    }
  };

  // Manejador de selección de archivo PDF de matrícula
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Únicamente se permite adjuntar documentación en formato PDF.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("El archivo supera el tamaño máximo permitido de 15MB.");
      return;
    }

    setAttachedDoc(file);
    setError(null);
  };

  // Presets rápidos para franja horaria
  const handleApplyPreset = (preset: "semana" | "semana_sabado" | "limpiar") => {
    if (preset === "limpiar") {
      setDias((prev) => prev.map((d) => ({ ...d, activo: false })));
      return;
    }

    if (preset === "semana") {
      setDias((prev) =>
        prev.map((d) => ({
          ...d,
          activo: d.dia_semana >= 1 && d.dia_semana <= 5,
          hora_inicio: "08:00",
          hora_fin: "17:00",
        }))
      );
      return;
    }

    if (preset === "semana_sabado") {
      setDias((prev) =>
        prev.map((d) => ({
          ...d,
          activo: d.dia_semana >= 1 && d.dia_semana <= 6,
          hora_inicio: d.dia_semana === 6 ? "09:00" : "08:00",
          hora_fin: d.dia_semana === 6 ? "13:00" : "17:00",
        }))
      );
    }
  };

  // Toggle de día individual
  const handleToggleDia = (diaSemana: number, activo: boolean) => {
    setDias((prev) =>
      prev.map((d) => (d.dia_semana === diaSemana ? { ...d, activo } : d))
    );
  };

  // Cambio de hora en un día
  const handleTimeChange = (
    diaSemana: number,
    campo: "hora_inicio" | "hora_fin",
    value: string
  ) => {
    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === diaSemana ? { ...d, [campo]: value } : d
      )
    );
  };

  // Guardar perfil y disponibilidad
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !apellido.trim()) {
      setError("El nombre y apellido son campos obligatorios.");
      return;
    }

    if (selectedOficios.length === 0) {
      setError("Debes seleccionar al menos un oficio o especialidad para tu perfil.");
      return;
    }

    // Validar horarios si hay días activos
    const hayHorarioInvalido = dias.some(
      (d) => d.activo && d.hora_inicio >= d.hora_fin
    );
    if (hayHorarioInvalido) {
      setError(
        "Por favor verifica que la hora de finalización sea posterior a la de inicio en todos los días activos."
      );
      return;
    }

    // Validar si requiere matrícula y falta adjuntar documento
    if (requiresLicenseDocUpload) {
      setError(
        "Has seleccionado oficios que requieren habilitación (Gasista o Electricista). Debes adjuntar la matrícula profesional en formato PDF para que un administrador pueda validarla."
      );
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const disponible = !isPaused;

      let resProfile: Response;

      // Si se adjuntó un documento PDF, enviamos como FormData (multipart/form-data)
      if (attachedDoc) {
        const formData = new FormData();
        formData.append("nombre", nombre.trim());
        formData.append("apellido", apellido.trim());
        formData.append("telefono", telefono.trim());
        formData.append("descripcion_perfil", bio.trim());
        formData.append("ubicacion_geografica", zonas.trim());
        formData.append("disponible", String(disponible));
        formData.append("oficios_ids", JSON.stringify(selectedOficios));
        formData.append("matricula_documento", attachedDoc);

        resProfile = await fetch(`${apiBase}/api/professionals/profile`, {
          method: "PUT",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
      } else {
        // Enviar como JSON normal
        resProfile = await fetch(`${apiBase}/api/professionals/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono.trim(),
            ubicacion_geografica: zonas.trim(),
            descripcion_perfil: bio.trim(),
            disponible,
            oficios_ids: selectedOficios,
          }),
        });
      }

      if (!resProfile.ok) {
        const errorData = await resProfile.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error || "No se pudo actualizar el perfil en la base de datos."
        );
      }

      // Guardar franja horaria / disponibilidad
      const horariosActivos = dias
        .filter((d) => d.activo)
        .map((d) => ({
          dia_semana: d.dia_semana,
          hora_inicio: d.hora_inicio,
          hora_fin: d.hora_fin,
        }));

      await fetch(`${apiBase}/api/professionals/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ horarios: horariosActivos }),
      });

      onProfileUpdated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error al guardar los cambios.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="relative w-full max-w-3xl my-auto rounded-3xl overflow-hidden shadow-2xl transition-all
        bg-white dark:bg-dark-surface
        border border-slate-200 dark:border-gray-800"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-800 bg-slate-50/70 dark:bg-dark-bg/50">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Editar Perfil Profesional
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            Configura tus oficios, franja horaria, zonas de cobertura y estado de actividad.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors
            bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700
            text-slate-600 dark:text-gray-300 cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-7 max-h-[80vh] overflow-y-auto">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-semibold flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. SECCIÓN: BOTÓN DE PAUSA PARA EL PERFIL */}
        <div
          className={`p-5 rounded-2xl border transition-all duration-200 ${
            isPaused
              ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
              : "bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-gray-800"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  isPaused
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {isPaused ? (
                  <PauseCircle className="w-6 h-6" />
                ) : (
                  <PlayCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Pausar perfil temporalmente
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isPaused
                        ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                        : "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                    }`}
                  >
                    {isPaused ? "Perfil Pausado" : "Perfil Activo"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  {isPaused
                    ? "Tu perfil no aparecerá en las búsquedas ni en el mapa hasta que lo despauses."
                    : "Tu perfil está visible para recibir nuevas solicitudes de clientes."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="cursor-pointer transition-transform active:scale-95 p-1"
              aria-label="Alternar pausa del perfil"
            >
              {isPaused ? (
                <ToggleRight className="w-10 h-10 text-amber-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-400 dark:text-gray-600 hover:text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* 2. SECCIÓN: DATOS BÁSICOS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Datos Personales</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-gray-300">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
                  bg-slate-50 dark:bg-dark-bg
                  text-slate-900 dark:text-white
                  border-slate-300 dark:border-gray-700
                  focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-gray-300">
                Apellido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
                  bg-slate-50 dark:bg-dark-bg
                  text-slate-900 dark:text-white
                  border-slate-300 dark:border-gray-700
                  focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-700 dark:text-gray-300">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: +54 9 299 123-4567"
              className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
                bg-slate-50 dark:bg-dark-bg
                text-slate-900 dark:text-white
                border-slate-300 dark:border-gray-700
                focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                Biografía Profesional
              </label>
              <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">
                {bio.length}/300
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntales a tus potenciales clientes sobre tu formación, trayectoria y garantía de trabajo..."
              className="w-full px-4 py-2.5 rounded-xl border text-sm font-normal leading-relaxed transition-all outline-none
                bg-slate-50 dark:bg-dark-bg
                text-slate-900 dark:text-white
                border-slate-300 dark:border-gray-700
                focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* 3. SECCIÓN: BOTONES PARA PONER OFICIOS Y SUBIR MATRÍCULA */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>Mis Oficios y Especialidades</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Los oficios habilitados aparecen seleccionados automáticamente desde la base de datos.
              </p>
            </div>

            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-primary border border-amber-200/60 dark:border-amber-900/40">
              {selectedOficios.length} seleccionado{selectedOficios.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Chips de Catálogo de Oficios */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {oficiosList.map((oficio) => {
              const isSelected = selectedOficios.includes(oficio.id);
              const requiresLic = isLicenseRequired(oficio);
              const isPending = pendingOficiosIds.includes(oficio.id);
              const isOriginal = originalOficios.includes(oficio.id);

              return (
                <button
                  key={oficio.id}
                  type="button"
                  onClick={() => handleToggleOficio(oficio.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                      : "bg-slate-50 dark:bg-dark-bg text-slate-700 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-primary/50"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{oficio.nombre}</span>

                  {requiresLic && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                        isSelected
                          ? "bg-white/25 text-white"
                          : isPending
                          ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                          : "bg-amber-50 dark:bg-amber-950/40 text-primary"
                      }`}
                    >
                      {isPending
                        ? "En revisión"
                        : isOriginal
                        ? "Habilitado"
                        : "Req. Matrícula"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ALERTA Y ADJUNTAR DOCUMENTO SI HAY NUEVO OFICIO QUE REQUIERE HABILITACIÓN */}
          {newOficiosRequiringLicense.length > 0 && (
            <div
              className={`p-5 rounded-2xl border transition-all ${
                attachedDoc
                  ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {attachedDoc ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 space-y-1">
                  <h4
                    className={`text-sm font-black ${
                      attachedDoc
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {attachedDoc
                      ? "Documentación de Matrícula Adjuntada"
                      : "Habilitación Requerida por un Administrador"}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-gray-300">
                    {attachedDoc
                      ? `Archivo listo para auditoría: ${attachedDoc.name} (${(
                          attachedDoc.size /
                          (1024 * 1024)
                        ).toFixed(2)} MB)`
                      : "Has seleccionado uno o más oficios que requieren carnet o matrícula oficial (Gasista / Electricista). Debes adjuntar tu documentación en PDF para que el equipo de administración verifique y habilite el rubro."}
                  </p>

                  {/* Botón o datos del archivo adjunto */}
                  <div className="pt-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {attachedDoc ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-dark-surface border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-primary" />
                          <span>Cambiar archivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAttachedDoc(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:opacity-90 transition-all shadow-sm shadow-primary/20 cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Adjuntar Matrícula (PDF)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. SECCIÓN: ZONAS DE COBERTURA */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Zonas de Cobertura</span>
            </h3>
            <span className="text-xs text-slate-400 dark:text-gray-500">
              Separadas por coma
            </span>
          </div>

          <input
            type="text"
            value={zonas}
            onChange={(e) => setZonas(e.target.value)}
            placeholder="Ej: Neuquén, Cipolletti, Plottier"
            className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
              bg-slate-50 dark:bg-dark-bg
              text-slate-900 dark:text-white
              border-slate-300 dark:border-gray-700
              focus:ring-2 focus:ring-primary focus:border-transparent"
          />

          {/* Chips de sugerencias rápidas */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
              Sugerencias rápidas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ZONAS_SUGERIDAS.map((zona) => {
                const isIncluded = zonas.toLowerCase().includes(zona.toLowerCase());
                return (
                  <button
                    key={zona}
                    type="button"
                    onClick={() => handleAddZona(zona)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                      isIncluded
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-slate-100 dark:bg-dark-bg text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-primary/40"
                    }`}
                  >
                    {isIncluded ? "✓ " : "+ "}
                    {zona}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. SECCIÓN: FRANJA HORARIA */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Franja Horaria de Atención</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Establece los días y horas en las que aceptas solicitudes.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("semana")}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-gray-300 hover:text-primary transition-colors border border-slate-200 dark:border-gray-700 cursor-pointer"
              >
                Lun-Vie (08-17)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("semana_sabado")}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-dark-bg text-slate-700 dark:text-gray-300 hover:text-primary transition-colors border border-slate-200 dark:border-gray-700 cursor-pointer"
              >
                Lun-Sáb
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("limpiar")}
                className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {loadingAvailability ? (
            <div className="p-4 text-center text-xs text-slate-400 font-bold">
              Cargando disponibilidad horaria...
            </div>
          ) : (
            <div className="space-y-2.5">
              {dias.map((dia) => {
                const isInvalido =
                  dia.activo && dia.hora_inicio >= dia.hora_fin;

                return (
                  <div
                    key={dia.dia_semana}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      dia.activo
                        ? "bg-slate-50 dark:bg-dark-bg border-slate-200 dark:border-gray-700"
                        : "bg-slate-50/40 dark:bg-dark-bg/40 border-slate-200/60 dark:border-gray-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between sm:justify-start gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dia.activo}
                          onChange={(e) =>
                            handleToggleDia(dia.dia_semana, e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>

                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          dia.activo
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-500 dark:text-gray-500"
                        }`}
                      >
                        {dia.nombre}
                      </span>
                    </div>

                    {dia.activo ? (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">
                            Desde:
                          </span>
                          <input
                            type="time"
                            value={dia.hora_inicio}
                            onChange={(e) =>
                              handleTimeChange(
                                dia.dia_semana,
                                "hora_inicio",
                                e.target.value
                              )
                            }
                            className="px-2 py-1 rounded-lg border text-xs font-bold outline-none bg-white dark:bg-dark-surface text-slate-900 dark:text-white border-slate-300 dark:border-gray-700 focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <span className="text-slate-400 text-xs">—</span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-400">
                            Hasta:
                          </span>
                          <input
                            type="time"
                            value={dia.hora_fin}
                            onChange={(e) =>
                              handleTimeChange(
                                dia.dia_semana,
                                "hora_fin",
                                e.target.value
                              )
                            }
                            className={`px-2 py-1 rounded-lg border text-xs font-bold outline-none bg-white dark:bg-dark-surface text-slate-900 dark:text-white focus:ring-1 focus:ring-primary ${
                              isInvalido
                                ? "border-red-500 text-red-500"
                                : "border-slate-300 dark:border-gray-700"
                            }`}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-gray-500 italic self-end sm:self-auto">
                        No disponible
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:opacity-90 shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <span>Guardar Perfil</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onProfileUpdated,
  initialData,
}) => {
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <EditProfileFormContent
        key={`${initialData.nombre}-${initialData.apellido}-${initialData.disponible}`}
        onClose={onClose}
        onProfileUpdated={onProfileUpdated}
        initialData={initialData}
      />
    </div>
  );
};

export default EditProfileModal;
