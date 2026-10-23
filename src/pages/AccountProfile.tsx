import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  PlusCircle,
  Briefcase,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Pencil,
  Eye,
  Clock,
  PauseCircle,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { ServiceCard } from "../components/ServiceCard";
import { ServiceModal } from "../components/ServiceModal";
import { ServiceDetailModal } from "../components/ServiceDetailModal";
import { EditProfileModal } from "../components/EditProfileModal";
import { ProfilePreviewModal } from "../components/ProfilePreviewModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { useAuth } from "../context/AuthContext";
import type { ProfessionalService } from "../types/professional";
import {
  getServices,
  saveService,
  deleteService,
  toggleServiceStatus,
  MAX_ACTIVE_SERVICES,
} from "../utils/servicesStorage";

interface AccountProfileProps {
  autoOpenCreateModal?: boolean;
}

export const AccountProfile: React.FC<AccountProfileProps> = ({
  autoOpenCreateModal = false,
}) => {
  const { user } = useAuth();

  // Estado del perfil cargado directamente de la BD
  const [profile, setProfile] = useState({
    nombre: user?.nombre || "Usuario",
    apellido: user?.apellido || "",
    telefono: "",
    trade: user?.rol === "PROFESIONAL" ? "Profesional" : "Cuenta de Cliente",
    zonas: "Buenos Aires, CABA y GBA",
    foto_perfil:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
    estado_validado: false,
    estado_auditoria: null as "PENDIENTE" | "APROBADO" | "RECHAZADO" | null,
    motivo_rechazo: null as string | null,
    tiene_solicitud: false,
    descripcion_perfil: "",
    disponible: true,
    rol: user?.rol || "CLIENTE",
    oficios: [] as any[],
    oficios_pendientes_ids: [] as number[],
    matricula_documento: null as string | null,
  });

  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(autoOpenCreateModal);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ProfessionalService | null>(null);
  const [editingService, setEditingService] = useState<ProfessionalService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ProfessionalService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notificaciones Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Carga de datos de perfil desde la Base de Datos
  const fetchProfileFromDB = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const res = await fetch(`${apiBase}/api/professionals/profile`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => ({
          ...prev,
          nombre: data.nombre || prev.nombre,
          apellido: data.apellido || prev.apellido,
          telefono: data.telefono || "",
          foto_perfil: data.foto_perfil || prev.foto_perfil,
          zonas: data.ubicacion_geografica || prev.zonas,
          descripcion_perfil: data.descripcion_perfil || "",
          disponible: data.disponible ?? true,
          trade:
            data.rol === "PROFESIONAL" && (data.estado_validado || data.estado_auditoria === "APROBADO")
              ? "Profesional Certificado"
              : "Cuenta de Cliente",
          estado_validado: Boolean(data.estado_validado),
          estado_auditoria: data.estado_auditoria || null,
          motivo_rechazo: data.motivo_rechazo || null,
          tiene_solicitud: Boolean(data.tiene_solicitud),
          rol: data.rol || prev.rol,
          oficios: data.oficios || [],
          oficios_pendientes_ids: data.oficios_pendientes_ids || [],
          matricula_documento: data.matricula_documento || null,
        }));
      }
    } catch (err) {
      console.warn("No se pudo cargar el perfil desde la BD, usando datos locales:", err);
    }
  }, []);

  const loadServicesData = useCallback(async () => {
    try {
      const list = await getServices();
      setServices(list);
    } catch (err) {
      console.error("Error al cargar servicios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileFromDB();
    loadServicesData();

    const handleServicesChanged = () => {
      loadServicesData();
    };

    window.addEventListener("servicesChanged", handleServicesChanged);
    return () => window.removeEventListener("servicesChanged", handleServicesChanged);
  }, [fetchProfileFromDB, loadServicesData]);

  const activeServicesCount = services.filter((s) => s.servicio_activo).length;

  const isAprobado =
    (profile.estado_validado && profile.estado_auditoria === "APROBADO") ||
    profile.rol === "PROFESIONAL";
  const isPendiente =
    profile.tiene_solicitud && profile.estado_auditoria === "PENDIENTE";
  const isRechazado =
    profile.tiene_solicitud && profile.estado_auditoria === "RECHAZADO";

  const handleOpenCreateService = () => {
    if (activeServicesCount >= MAX_ACTIVE_SERVICES) {
      setToastMessage({
        type: "error",
        text: `Has alcanzado el límite inicial de ${MAX_ACTIVE_SERVICES} servicios activos. Puedes publicar nuevos guardándolos pausados, o pausar uno existente primero.`,
      });
      return;
    }
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: ProfessionalService) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (
    serviceData: Omit<ProfessionalService, "id"> & { id?: string }
  ) => {
    try {
      await saveService(serviceData);
      setIsServiceModalOpen(false);
      setEditingService(null);
      setToastMessage({
        type: "success",
        text: serviceData.id
          ? "Servicio actualizado correctamente."
          : "¡Servicio publicado con éxito en tu catálogo!",
      });
      await loadServicesData();
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "No se pudo guardar el servicio.",
      });
    }
  };

  const handleTogglePauseService = async (service: ProfessionalService) => {
    try {
      await toggleServiceStatus(service.id);
      setToastMessage({
        type: "success",
        text: service.servicio_activo
          ? `Servicio "${service.titulo_servicio}" pausado.`
          : `Servicio "${service.titulo_servicio}" activado.`,
      });
      await loadServicesData();
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "No se pudo cambiar el estado del servicio.",
      });
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteService(serviceToDelete.id);
      setToastMessage({
        type: "success",
        text: `Servicio "${serviceToDelete.titulo_servicio}" eliminado permanentemente.`,
      });
      setServiceToDelete(null);
      setSelectedServiceDetail(null);
      await loadServicesData();
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err.message || "No se pudo eliminar el servicio.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-dark dark:text-dark-text transition-colors duration-200 pb-20">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Navegación y título de la vista */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-dark/70 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
          <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 dark:text-gray-500">
            Detalles de la Cuenta
          </span>
        </div>

        {/* Notificación Toast flotante */}
        {toastMessage && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all duration-200 animate-in fade-in ${
              toastMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span className="text-sm font-bold">{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tarjeta de Perfil Profesional (Idéntica a mobile profileCard) */}
        <section className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-dark-surface border border-slate-200 dark:border-gray-800 shadow-sm mb-8 transition-colors">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <img
                src={profile.foto_perfil}
                alt="Foto de perfil"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-slate-100 dark:border-gray-700 shadow-md"
              />
              <div
                className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white dark:border-dark-surface flex items-center justify-center text-white ${
                  profile.disponible ? "bg-emerald-500" : "bg-slate-400"
                }`}
                title={profile.disponible ? "Disponible" : "No disponible"}
              >
                <BadgeCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {profile.nombre} {profile.apellido}
                </h1>

                {/* Badges de Auditoría y Verificación */}
                {isAprobado && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 w-fit mx-auto sm:mx-0">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Aprobado</span>
                  </div>
                )}

                {!profile.disponible && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 w-fit mx-auto sm:mx-0">
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>En Pausa</span>
                  </div>
                )}

                {isPendiente && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 w-fit mx-auto sm:mx-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendiente de Auditoría</span>
                  </div>
                )}

                {isRechazado && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 w-fit mx-auto sm:mx-0">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Rechazado</span>
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold text-primary">
                {profile.trade} • {profile.zonas}
              </p>

              {profile.descripcion_perfil && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 line-clamp-2 max-w-2xl leading-relaxed pt-1">
                  "{profile.descripcion_perfil}"
                </p>
              )}

              {/* Botones de Acción del Perfil: Editar y Previsualizar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-primary text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Editar Perfil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Previsualizar Perfil (Vista Cliente)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Banner si el perfil se encuentra en Modo Pausa */}
        {!profile.disponible && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs sm:text-sm font-bold">
                Tu perfil se encuentra en Modo Pausa y no aparece en las búsquedas de clientes. Puedes reactivarlo cuando desees desde Editar Perfil.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0 cursor-pointer w-fit"
            >
              Reactivar Perfil
            </button>
          </div>
        )}

        {/* CASO 1: Solicitud en Estado Pendiente de Auditoría */}
        {isPendiente && (
          <section className="mb-8 p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold">Solicitud en Revisión</h3>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  En proceso de auditoría por el equipo de administración
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-800 dark:text-amber-300/90 pl-9">
              Tus documentos de identidad, oficios y situación fiscal han sido recibidos y se encuentran en proceso de verificación. Mientras tanto, tu perfil opera en modo cliente.
            </p>
          </section>
        )}

        {/* CASO 2: Solicitud Rechazada */}
        {isRechazado && (
          <section className="mb-8 p-6 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold">Solicitud Rechazada</h3>
                <span className="text-xs font-bold text-red-700 dark:text-red-300">
                  Requiere corrección de documentos
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-red-800 dark:text-red-300/90 pl-9 mb-3">
              Motivo: {profile.motivo_rechazo || "La documentación cargada no cumple con los requisitos o es ilegible."}
            </p>
          </section>
        )}

        {/* CASO 3 & 4: Gestión de Servicios del Profesional */}
        {isAprobado && (
          <>
            {/* Botón Principal: Crear Nuevo Servicio */}
            <section className="mb-8">
              <button
                type="button"
                onClick={handleOpenCreateService}
                className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-white transition-all duration-200 shadow-lg shadow-primary/25 flex items-center justify-center gap-3 cursor-pointer
                  bg-primary hover:opacity-95 active:scale-[0.99]"
              >
                <PlusCircle className="w-6 h-6" />
                <span>Crear Nuevo Servicio</span>
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-extrabold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Con Asistente IA</span>
                </div>
              </button>
            </section>

            {/* Encabezado con Contador de Servicios Activos */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-primary">
                MIS SERVICIOS PUBLICADOS
              </h2>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  activeServicesCount >= MAX_ACTIVE_SERVICES
                    ? "bg-red-50 dark:bg-red-950/40 text-red-500 border-red-300 dark:border-red-800"
                    : "bg-amber-50 dark:bg-amber-950/40 text-primary border-amber-200 dark:border-amber-900/40"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {activeServicesCount}/{MAX_ACTIVE_SERVICES} activos
                </span>
              </div>
            </div>

            {/* Lista de Servicios */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-bold">
                Cargando catálogo de servicios...
              </div>
            ) : services.length === 0 ? (
              <div className="rounded-3xl p-10 sm:p-14 bg-white dark:bg-dark-surface border border-dashed border-slate-300 dark:border-gray-800 text-center flex flex-col items-center justify-center transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-dark-bg text-primary flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                  Sin servicios publicados
                </h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">
                  Publica tus tarifas y tiempos para que los clientes te contraten directamente sin consultas previas.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateService}
                  className="py-2.5 px-5 rounded-xl font-bold text-sm text-white bg-primary hover:opacity-90 shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publicar Primer Servicio</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {services.map((srv) => (
                  <ServiceCard
                    key={srv.id}
                    service={srv}
                    onPress={(s) => setSelectedServiceDetail(s)}
                    onEdit={handleOpenEditService}
                    onTogglePause={handleTogglePauseService}
                    onDelete={(s) => setServiceToDelete(s)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 1. Modal para Crear / Editar Servicio con Asistente IA */}
      <ServiceModal
        visible={isServiceModalOpen}
        service={editingService}
        onClose={() => {
          setIsServiceModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
      />

      {/* 2. Modal de Detalle Completo del Servicio */}
      <ServiceDetailModal
        visible={Boolean(selectedServiceDetail)}
        service={selectedServiceDetail}
        onClose={() => setSelectedServiceDetail(null)}
        onEditService={(srv: ProfessionalService) => {
          setSelectedServiceDetail(null);
          handleOpenEditService(srv);
        }}
        onDeleteService={(srv: ProfessionalService) => {
          setSelectedServiceDetail(null);
          setServiceToDelete(srv);
        }}
      />

      {/* 3. Modal para Editar Perfil Profesional (guardado en BD) */}
      <EditProfileModal
        visible={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onProfileUpdated={fetchProfileFromDB}
        initialData={{
          nombre: profile.nombre,
          apellido: profile.apellido,
          telefono: profile.telefono,
          ubicacion_geografica: profile.zonas,
          descripcion_perfil: profile.descripcion_perfil,
          disponible: profile.disponible,
          oficios: profile.oficios,
          oficios_pendientes_ids: profile.oficios_pendientes_ids,
          matricula_documento: profile.matricula_documento,
        }}
      />

      {/* 4. Modal para Previsualizar Perfil (Vista Cliente) */}
      <ProfilePreviewModal
        visible={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        nombre={profile.nombre}
        apellido={profile.apellido}
        fotoPerfil={profile.foto_perfil}
        bio={profile.descripcion_perfil}
        zonasCobertura={profile.zonas}
        trade={profile.trade}
        servicios={services}
      />

      {/* 5. Modal de Confirmación para Eliminar Servicio */}
      <ConfirmDeleteModal
        visible={Boolean(serviceToDelete)}
        serviceTitle={serviceToDelete?.titulo_servicio}
        isDeleting={isDeleting}
        onCancel={() => setServiceToDelete(null)}
        onConfirm={handleConfirmDeleteService}
      />
    </div>
  );
};

export default AccountProfile;
