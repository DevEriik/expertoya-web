import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  FileText,
  X,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowLeft,
  LogOut,
  AlertTriangle,
  Send,
  Loader2,
  Check,
  ShieldAlert,
  Ban,
  Clock,
  RefreshCw,
  Scale,
  MessageSquare,
  AlertOctagon,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

interface ProfesionalAuditoria {
  id: string;
  estado_validado: boolean;
  estado_auditoria: "PENDIENTE" | "APROBADO" | "RECHAZADO";
  motivo_rechazo: string | null;
  fecha_validacion: string | null;
  cuit: string | null;
  matricula_documento: string | null;
  dni_frente: string | null;
  dni_dorso: string | null;
  selfie_biometrica: string | null;
  antecedentes_penales: string | null;
  certificado_no_deudor: string | null;
  constancia_afip: string | null;
  oficios?: { id: number; nombre_oficio: string }[];
  es_profesional_auditado_nueva_matricula?: boolean;
  oficios_pendientes?: { id: number; nombre_oficio: string }[];
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  };
}

export interface ReporteItem {
  id: string;
  denunciante_id: string;
  denunciado_id: string;
  solicitud_id: string | null;
  tipo_motivo: string;
  descripcion: string;
  captura_url: string | null;
  estado: "PENDIENTE" | "EN_REVISION" | "RESUELTO_CON_SANCION" | "DESESTIMADO";
  sancion_aplicada: "ADVERTENCIA" | "SUSPENSION_TEMPORAL" | "EXPULSION_DEFINITIVA" | "NINGUNA";
  resolucion_admin: string | null;
  revisado_por: string | null;
  creado_en: string;
  actualizado_en: string;
  denunciante: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
    rol: string;
    foto_perfil?: string | null;
  };
  denunciado: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
    rol: string;
    foto_perfil?: string | null;
    strikes?: number;
    activo?: boolean;
    suspendido_hasta?: string | null;
  };
  solicitud?: {
    id: string;
    estado_solicitud_trabajo: string;
    fecha_solicitada?: string;
    servicio?: {
      titulo_servicio: string;
      oficio?: { nombre_oficio: string };
    };
  } | null;
  admin_revisor?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}

export interface BloqueoItem {
  id: string;
  bloqueador_id: string;
  bloqueado_id: string;
  solicitud_id: string | null;
  motivo: string;
  fecha_bloqueo: string;
  activo: boolean;
  bloqueador: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    foto_perfil?: string | null;
  };
  bloqueado: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
    strikes?: number;
    activo?: boolean;
    suspendido_hasta?: string | null;
    foto_perfil?: string | null;
  };
  solicitud?: {
    id: string;
    estado_solicitud_trabajo: string;
    fecha_solicitada?: string;
  } | null;
}

export interface ReincidenteUser {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  strikes: number;
  activo: boolean;
  total_bloqueos_recibidos: number;
  foto_perfil?: string | null;
}

export interface ModalAuditData {
  reporte: ReporteItem;
  mensajes: Array<{
    id: string;
    contenido: string;
    enviado_en: string;
    remitente_id: string;
    remitente: {
      id: string;
      nombre: string;
      apellido: string;
      rol: string;
      foto_perfil?: string | null;
    };
    adjunto_url?: string | null;
  }>;
  bloqueos: Array<{
    id: string;
    motivo: string;
    fecha_bloqueo: string;
  }>;
  stats: {
    reportes_previos: number;
    bloqueos_recibidos: number;
  };
}

export const MOTIVO_LABELS: Record<
  string,
  { label: string; icon: string; desc: string }
> = {
  PAGO_FUERA_PLATAFORMA: {
    label: "Pago / Cobro fuera de plataforma",
    icon: "💸",
    desc: "Evasión de Garantía Escrow",
  },
  ACOSO_O_LENGUAJE_OFENSIVO: {
    label: "Lenguaje ofensivo o acoso",
    icon: "🤬",
    desc: "Insultos o conducta inapropiada",
  },
  INCUMPLIMIENTO_SERVICIO: {
    label: "Incumplimiento del servicio",
    icon: "🚫",
    desc: "Ausencia o abandono del trabajo",
  },
  SUPLANTACION_O_FRAUDE: {
    label: "Suplantación o perfil falso",
    icon: "🎭",
    desc: "Fraude de identidad o engaño",
  },
  OTRO: {
    label: "Otro motivo grave",
    icon: "⚠️",
    desc: "Infracción a condiciones de uso",
  },
};

export const formatearFecha = (fechaStr: string) => {
  try {
    const d = new Date(fechaStr);
    return d.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return fechaStr;
  }
};

type TabType =
  | "PENDIENTE"
  | "APROBADO"
  | "RECHAZADO"
  | "REPORTES"
  | "BLOQUEOS";

interface RejectModalData {
  id: string;
  nombre: string;
  email: string;
  esNuevaMatricula?: boolean;
  oficiosPendientes?: string[];
}

interface ApproveModalData {
  id: string;
  nombre: string;
  esNuevaMatricula?: boolean;
  oficiosPendientes?: string[];
}

const MOTIVOS_PREDETERMINADOS = [
  "Documentación no legible o incompleta",
  "Fotografía del DNI borrosa, cortada o con reflejos que impiden su lectura",
  "La selfie biométrica no es clara o no coincide con la fotografía del DNI",
  "Constancia de AFIP / ARCA desactualizada, vencida o con CUIT incorrecto",
  "Certificado de antecedentes penales vencido (mayor a 3 meses) o no oficial",
  "Certificado de No Deudor Alimentario ilegible, incompleto o no válido",
  "Matrícula profesional inválida o no concordante con el oficio postulado",
];

export const AdminBackoffice = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("PENDIENTE");
  const [profesionales, setProfesionales] = useState<ProfesionalAuditoria[]>(
    [],
  );
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    titulo: string;
    esPdf: boolean;
    profesional?: string;
  } | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  // Estados de Denuncias y Reportes
  const [reportes, setReportes] = useState<ReporteItem[]>([]);
  const [totalReportes, setTotalReportes] = useState<number>(0);
  const [reportesPendientesCount, setReportesPendientesCount] = useState<number>(0);
  const [filtroEstadoReporte, setFiltroEstadoReporte] = useState<string>("TODOS");
  const [cargandoReportes, setCargandoReportes] = useState<boolean>(false);

  // Estados de Bitácora de Bloqueos
  const [bloqueos, setBloqueos] = useState<BloqueoItem[]>([]);
  const [totalBloqueos, setTotalBloqueos] = useState<number>(0);
  const [reincidentes, setReincidentes] = useState<ReincidenteUser[]>([]);
  const [cargandoBloqueos, setCargandoBloqueos] = useState<boolean>(false);

  // Modal de Auditoría de Chat
  const [modalAuditChat, setModalAuditChat] = useState<ModalAuditData | null>(null);
  const [cargandoAuditChat, setCargandoAuditChat] = useState<boolean>(false);

  // Modal de Resolución de Denuncia
  const [modalResolver, setModalResolver] = useState<ReporteItem | null>(null);
  const [sancionSeleccionada, setSancionSeleccionada] = useState<
    "ADVERTENCIA" | "SUSPENSION_TEMPORAL" | "EXPULSION_DEFINITIVA" | "NINGUNA"
  >("ADVERTENCIA");
  const [resolucionTexto, setResolucionTexto] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);

  const [rejectModal, setRejectModal] = useState<RejectModalData | null>(null);
  const [selectedMotivoIndex, setSelectedMotivoIndex] = useState<
    number | "otro"
  >(0);
  const [customMotivo, setCustomMotivo] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [approveModal, setApproveModal] = useState<ApproveModalData | null>(
    null,
  );
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<{
    tipo: "success" | "error";
    texto: string;
  } | null>(null);
  const previewVersionRef = useRef(0);

  const getFileUrl = (path: string | null) => {
    if (!path || path.trim() === "" || path.includes("[object Object]"))
      return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const clean = path.replace(/\\/g, "/");
    return `http://localhost:3000/${clean.startsWith("/") ? clean.slice(1) : clean}`;
  };

  const abrirDocumento = (
    path: string | null,
    titulo: string,
    profesional?: string,
  ) => {
    const rawUrl = getFileUrl(path);
    if (!rawUrl) {
      setToastMessage({
        tipo: "error",
        texto:
          "El archivo adjunto no tiene una ruta válida o aún no ha sido cargado al servidor.",
      });
      return;
    }
    const esPdf = rawUrl.toLowerCase().includes(".pdf");
    setImgError(false);
    previewVersionRef.current += 1;
    const url = `${rawUrl}?t=${previewVersionRef.current}`;
    setPreviewDoc({ url, titulo, esPdf, profesional });
  };

  const cargarProfesionales = async (tab: TabType = activeTab) => {
    setCargando(true);
    setErrorAuth(null);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorAuth(
          "No se detectó un token de sesión activo. Por favor inicia sesión como administrador.",
        );
        setCargando(false);
        return;
      }

      const respuesta = await fetch(
        `http://localhost:3000/api/admin/professionals?status=${tab}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (respuesta.ok) {
        const datos = await respuesta.json();
        setProfesionales(datos);
      } else if (respuesta.status === 401 || respuesta.status === 403) {
        logout();
        setErrorAuth(
          respuesta.status === 401
            ? "Tu sesión ha expirado o ya no es válida. Por favor vuelve a iniciar sesión con tu cuenta de Administrador (erick@admin.com)."
            : "Acceso denegado: este usuario no tiene permisos de Administrador.",
        );
      } else {
        console.error("Error en la respuesta del backend:", respuesta.status);
      }
    } catch (error) {
      console.error("Error al obtener profesionales:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarReportes = async () => {
    setCargandoReportes(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const q =
        filtroEstadoReporte !== "TODOS" ? `?estado=${filtroEstadoReporte}` : "";
      const res = await fetch(`http://localhost:3000/api/admin/reportes${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const lista: ReporteItem[] = data.reportes || [];
        setReportes(lista);
        setTotalReportes(data.total || 0);

        const pendientes = lista.filter((r) => r.estado === "PENDIENTE").length;
        setReportesPendientesCount(pendientes);
      }
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    } finally {
      setCargandoReportes(false);
    }
  };

  const cargarBloqueos = async () => {
    setCargandoBloqueos(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`http://localhost:3000/api/admin/bloqueos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBloqueos(data.bloqueos || []);
        setTotalBloqueos(data.total || 0);
        setReincidentes(data.reincidentes || []);
      }
    } catch (err) {
      console.error("Error al cargar bloqueos:", err);
    } finally {
      setCargandoBloqueos(false);
    }
  };

  // Inicialización de WebSockets para alertas en vivo al Backoffice
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket: Socket = io("http://localhost:3000", {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_solicitud", { solicitud_id: "admins" });
    });

    socket.on("admin:nuevo_reporte", (data: any) => {
      setToastMessage({
        tipo: "error",
        texto: `⚠️ Nueva denuncia registrada: ${MOTIVO_LABELS[data?.tipo_motivo]?.label || "Reporte de usuario"
          }.`,
      });
      setReportesPendientesCount((prev) => prev + 1);
      cargarReportes();
    });

    socket.on("admin:alerta_bloqueo", (data: any) => {
      setToastMessage({
        tipo: "error",
        texto: `🚫 Alerta de bloqueo bilateral registrado: ${data?.motivo || ""}.`,
      });
      cargarBloqueos();
    });

    socket.on("admin:reporte_resuelto", () => {
      cargarReportes();
    });

    cargarReportes();
    cargarBloqueos();

    return () => {
      socket.disconnect();
    };
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    if (activeTab === "REPORTES") {
      cargarReportes();
    } else if (activeTab === "BLOQUEOS") {
      cargarBloqueos();
    } else {
      cargarProfesionales(activeTab);
    }
  }, [activeTab, filtroEstadoReporte]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const abrirModalAuditoria = async (rep: ReporteItem) => {
    setCargandoAuditChat(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/admin/reportes/${rep.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setModalAuditChat({
          reporte: data.reporte || rep,
          mensajes: data.mensajes || [],
          bloqueos: data.bloqueos || [],
          stats: data.estadisticas_denunciado || {
            reportes_previos: 0,
            bloqueos_recibidos: 0,
          },
        });
      } else {
        setToastMessage({
          tipo: "error",
          texto: "No se pudo recuperar la conversación auditada.",
        });
      }
    } catch {
      setToastMessage({
        tipo: "error",
        texto: "Error de red al consultar detalle del reporte.",
      });
    } finally {
      setCargandoAuditChat(false);
    }
  };

  const abrirModalResolver = (rep: ReporteItem) => {
    setModalResolver(rep);
    setSancionSeleccionada(
      rep.sancion_aplicada && rep.sancion_aplicada !== "NINGUNA"
        ? (rep.sancion_aplicada as any)
        : "ADVERTENCIA",
    );
    setResolucionTexto(rep.resolucion_admin || "");
  };

  const confirmarResolucion = async () => {
    if (!modalResolver) return;
    if (!resolucionTexto.trim()) {
      setToastMessage({
        tipo: "error",
        texto: "Debes ingresar una fundamentación o dictamen obligatorio.",
      });
      return;
    }

    setIsResolving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/admin/reportes/${modalResolver.id}/resolver`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sancion: sancionSeleccionada,
            resolucion: resolucionTexto.trim(),
          }),
        },
      );

      if (res.ok) {
        setToastMessage({
          tipo: "success",
          texto: `Denuncia resuelta con éxito: Dictamen aplicado a ${modalResolver.denunciado.nombre}.`,
        });
        setModalResolver(null);
        if (modalAuditChat) setModalAuditChat(null);
        cargarReportes();
      } else {
        const err = await res.json().catch(() => ({}));
        setToastMessage({
          tipo: "error",
          texto: err.error || "No se pudo resolver la denuncia.",
        });
      }
    } catch (err: any) {
      setToastMessage({
        tipo: "error",
        texto: err.message || "Error al conectar con el servidor.",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const abrirModalAprobar = (prof: ProfesionalAuditoria) => {
    const oficiosTxt = (prof.oficios_pendientes || []).map(
      (o) => o.nombre_oficio,
    );
    setApproveModal({
      id: prof.id,
      nombre: `${prof.usuario.nombre} ${prof.usuario.apellido}`,
      esNuevaMatricula: Boolean(prof.es_profesional_auditado_nueva_matricula),
      oficiosPendientes: oficiosTxt,
    });
  };

  const confirmarAprobacion = async () => {
    if (!approveModal) return;
    setIsApproving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/admin/professionals/${approveModal.id}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setProfesionales((prev) =>
          prev.filter((p) => p.id !== approveModal.id),
        );
        setToastMessage({
          tipo: "success",
          texto: approveModal.esNuevaMatricula
            ? `¡Matrícula de ${approveModal.nombre} aprobada! Se habilitó el oficio ${approveModal.oficiosPendientes?.join(", ")} y se envió la confirmación por correo.`
            : `¡Perfil de ${approveModal.nombre} aprobado y validado con éxito!`,
        });
        setApproveModal(null);
      } else {
        setToastMessage({
          tipo: "error",
          texto: "No se pudo aprobar el profesional en el servidor.",
        });
      }
    } catch (error) {
      console.error("Error al aprobar:", error);
      setToastMessage({
        tipo: "error",
        texto: "Error de red al intentar aprobar la solicitud.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const abrirModalRechazo = (prof: ProfesionalAuditoria) => {
    const oficiosTxt = (prof.oficios_pendientes || []).map(
      (o) => o.nombre_oficio,
    );
    setRejectModal({
      id: prof.id,
      nombre: `${prof.usuario.nombre} ${prof.usuario.apellido}`,
      email: prof.usuario.email,
      esNuevaMatricula: Boolean(prof.es_profesional_auditado_nueva_matricula),
      oficiosPendientes: oficiosTxt,
    });
    setSelectedMotivoIndex(0);
    setCustomMotivo("");
    setRejectError(null);
  };

  const confirmarRechazo = async () => {
    if (!rejectModal) return;

    const motivoFinal =
      selectedMotivoIndex === "otro"
        ? customMotivo.trim()
        : MOTIVOS_PREDETERMINADOS[selectedMotivoIndex];

    if (!motivoFinal) {
      setRejectError(
        "Por favor, ingresa el motivo del rechazo en el campo de texto.",
      );
      return;
    }

    setIsRejecting(true);
    setRejectError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/admin/professionals/${rejectModal.id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ motivo: motivoFinal }),
        },
      );

      if (res.ok) {
        setProfesionales((prev) => prev.filter((p) => p.id !== rejectModal.id));
        setToastMessage({
          tipo: "success",
          texto: rejectModal.esNuevaMatricula
            ? `Se rechazó la matrícula de ${rejectModal.nombre}. Se notificó el motivo por email y su perfil profesional se mantiene activo.`
            : `Solicitud de ${rejectModal.nombre} rechazada. Se envió la notificación con el motivo a su correo.`,
        });
        setRejectModal(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setRejectError(
          errorData.error || "No se pudo rechazar la solicitud en el servidor.",
        );
      }
    } catch (error) {
      console.error("Error al rechazar:", error);
      setRejectError("Error de conexión al enviar el rechazo.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCerrarSesion = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-white border-b border-gray-100 py-3 px-6 mb-8 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-dark/70 hover:text-primary font-bold text-sm transition"
          >
            <ArrowLeft size={18} />
            Volver a la Web
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <User size={14} className="text-primary" />
                {user.nombre} ({user.rol})
              </span>
            )}
            <button
              onClick={handleCerrarSesion}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
              <ShieldCheck className="text-primary" size={32} />
              {activeTab === "REPORTES"
                ? "Auditoría de Denuncias y Reportes"
                : activeTab === "BLOQUEOS"
                  ? "Bitácora y Detección de Bloqueos"
                  : "Panel de Auditoría de Profesionales"}
            </h1>
            <p className="text-dark/60 mt-1">
              {activeTab === "REPORTES"
                ? "Investigación de faltas graves, transcripciones de chat y aplicación de sanciones disciplinarias"
                : activeTab === "BLOQUEOS"
                  ? "Historial bilateral de bloqueos y alertas de usuarios con alta tasa de reincidencia"
                  : "Revisión de identidad, situación fiscal y matrículas para activación de cuentas"}
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === "REPORTES") cargarReportes();
              else if (activeTab === "BLOQUEOS") cargarBloqueos();
              else cargarProfesionales(activeTab);
            }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-dark font-semibold text-sm rounded-xl transition flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw size={15} />
            Actualizar lista
          </button>
        </div>

        {errorAuth && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <p className="font-bold">Sesión no autorizada o expirada</p>
              <p className="text-xs text-amber-800 mt-0.5">{errorAuth}</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs transition shadow-sm"
            >
              Iniciar Sesión como Administrador
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("PENDIENTE")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === "PENDIENTE"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <ShieldCheck size={16} />
            Solicitantes
          </button>
          <button
            onClick={() => setActiveTab("APROBADO")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === "APROBADO"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <CheckCircle size={16} />
            Auditados
          </button>
          <button
            onClick={() => setActiveTab("RECHAZADO")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === "RECHAZADO"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <XCircle size={16} />
            Rechazados
          </button>

          <div className="h-5 w-px bg-gray-200 mx-2" />

          <button
            onClick={() => setActiveTab("REPORTES")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === "REPORTES"
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <ShieldAlert size={16} />
            Denuncias y Reportes
            {reportesPendientesCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#EF4444] text-white animate-pulse">
                {reportesPendientesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("BLOQUEOS")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${activeTab === "BLOQUEOS"
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            <Ban size={16} />
            Registro de Bloqueos
            {reincidentes.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {reincidentes.length} alerta{reincidentes.length > 1 ? "s" : ""}
              </span>
            )}
          </button>
        </div>

        {(activeTab === "PENDIENTE" ||
          activeTab === "APROBADO" ||
          activeTab === "RECHAZADO") && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {cargando ? (
                <p className="p-12 text-center text-gray-500 font-medium">
                  Cargando legajos...
                </p>
              ) : profesionales.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="mx-auto text-success mb-3" size={40} />
                  <p className="text-gray-700 font-bold text-lg">
                    {activeTab === "PENDIENTE" &&
                      "¡Al día! No hay profesionales pendientes de validación."}
                    {activeTab === "APROBADO" &&
                      "Aún no hay profesionales auditados y aprobados."}
                    {activeTab === "RECHAZADO" &&
                      "No hay profesionales en el historial de rechazados."}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {activeTab === "PENDIENTE" &&
                      "Todas las solicitudes recibidas han sido auditadas."}
                    {activeTab === "APROBADO" &&
                      "Los perfiles aprobados aparecerán aquí."}
                    {activeTab === "RECHAZADO" &&
                      "El registro de legajos rechazados aparecerá aquí con sus motivos."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-dark/70 text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold">Profesional</th>
                        <th className="p-4 font-bold">CUIT / Fiscal</th>
                        <th className="p-4 font-bold">Oficios</th>
                        <th className="p-4 font-bold">Documentación Adjunta</th>
                        <th className="p-4 font-bold text-right">
                          {activeTab === "PENDIENTE"
                            ? "Acciones"
                            : activeTab === "APROBADO"
                              ? "Estado"
                              : "Motivo de Rechazo"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {profesionales.map((prof) => (
                        <tr
                          key={prof.id}
                          className={`transition-colors ${prof.es_profesional_auditado_nueva_matricula
                              ? "bg-amber-50/40 hover:bg-amber-50/70"
                              : "hover:bg-gray-50/50"
                            }`}
                        >
                          <td className="p-4 align-top">
                            {prof.es_profesional_auditado_nueva_matricula && (
                              <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/15 border border-orange-300 text-orange-900 rounded-lg text-xs font-bold shadow-2xs">
                                <ShieldCheck
                                  size={14}
                                  className="text-orange-600 shrink-0"
                                />
                                <span>
                                  Profesional ya auditado (Nueva matrícula)
                                </span>
                              </div>
                            )}
                            <div className="font-bold text-dark text-base">
                              {prof.usuario.nombre} {prof.usuario.apellido}
                            </div>
                            <div className="text-xs text-dark/60 font-medium">
                              {prof.usuario.email}
                            </div>
                            {prof.usuario.telefono && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                Tel: {prof.usuario.telefono}
                              </div>
                            )}
                          </td>

                          <td className="p-4 align-top text-sm">
                            {prof.cuit ? (
                              <span className="font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs">
                                {prof.cuit}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Sin CUIT
                              </span>
                            )}
                          </td>

                          <td className="p-4 align-top">
                            <div className="flex flex-wrap gap-1.5 max-w-xs mb-2">
                              {prof.oficios && prof.oficios.length > 0 ? (
                                prof.oficios.map((oficio) => (
                                  <span
                                    key={oficio.id}
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold flex items-center gap-1"
                                  >
                                    <Check size={11} className="text-emerald-600" />
                                    {oficio.nombre_oficio}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">
                                  Sin oficios previos
                                </span>
                              )}
                            </div>

                            {prof.es_profesional_auditado_nueva_matricula &&
                              prof.oficios_pendientes &&
                              prof.oficios_pendientes.length > 0 && (
                                <div className="p-2 bg-orange-50 border border-orange-300 rounded-xl text-xs">
                                  <span className="font-bold text-orange-950 block text-[11px] uppercase tracking-wider mb-1">
                                    Nueva matrícula a validar:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {prof.oficios_pendientes.map((o) => (
                                      <span
                                        key={o.id}
                                        className="px-2 py-0.5 bg-orange-600 text-white rounded text-xs font-bold"
                                      >
                                        ★ {o.nombre_oficio}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </td>

                          <td className="p-4 align-top">
                            <div className="grid grid-cols-2 gap-1.5 text-xs">
                              {prof.dni_frente && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.dni_frente,
                                      "DNI Frente",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className="text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium rounded border border-gray-200 flex items-center gap-1"
                                >
                                  <FileText size={12} /> DNI Frente
                                </button>
                              )}
                              {prof.dni_dorso && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.dni_dorso,
                                      "DNI Dorso",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className="text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium rounded border border-gray-200 flex items-center gap-1"
                                >
                                  <FileText size={12} /> DNI Dorso
                                </button>
                              )}
                              {prof.selfie_biometrica && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.selfie_biometrica,
                                      "Selfie Biométrica",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className="text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium rounded border border-gray-200 flex items-center gap-1"
                                >
                                  <User size={12} /> Selfie
                                </button>
                              )}
                              {prof.constancia_afip && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.constancia_afip,
                                      "Constancia AFIP",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className="text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 text-emerald-700 font-medium rounded border border-gray-200 flex items-center gap-1"
                                >
                                  <FileText size={12} /> AFIP
                                </button>
                              )}
                              {prof.antecedentes_penales && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.antecedentes_penales,
                                      "Antecedentes Penales",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className="text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 text-purple-700 font-medium rounded border border-gray-200 flex items-center gap-1"
                                >
                                  <FileText size={12} /> Antecedentes
                                </button>
                              )}
                              {prof.certificado_no_deudor && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.certificado_no_deudor,
                                      "No Deudor Alimentario",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className="text-left px-2 py-1 bg-gray-50 hover:bg-gray-100 text-purple-700 font-medium rounded border border-gray-200 flex items-center gap-1"
                                >
                                  <FileText size={12} /> No Deudor
                                </button>
                              )}
                              {prof.matricula_documento && (
                                <button
                                  onClick={() =>
                                    abrirDocumento(
                                      prof.matricula_documento,
                                      "Matrícula Habilitante (PDF)",
                                      `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                    )
                                  }
                                  className={`col-span-2 text-left px-2.5 py-1.5 font-bold rounded-lg border flex items-center gap-1.5 transition ${prof.es_profesional_auditado_nueva_matricula
                                      ? "bg-orange-100 hover:bg-orange-200 text-orange-950 border-orange-400 shadow-2xs"
                                      : "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200"
                                    }`}
                                >
                                  <FileText
                                    size={13}
                                    className="text-orange-700 shrink-0"
                                  />
                                  <span>
                                    {prof.es_profesional_auditado_nueva_matricula
                                      ? "Ver Matrícula Nueva Adjunta (PDF)"
                                      : "Matrícula Habilitante (PDF)"}
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="p-4 align-top text-right">
                            {activeTab === "PENDIENTE" && (
                              <div className="space-x-2 whitespace-nowrap inline-flex">
                                <button
                                  onClick={() => abrirModalAprobar(prof)}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 ${prof.es_profesional_auditado_nueva_matricula
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80"
                                    }`}
                                  title={
                                    prof.es_profesional_auditado_nueva_matricula
                                      ? "Validar y habilitar nueva matrícula"
                                      : "Aprobar legajo y activar profesional"
                                  }
                                >
                                  <CheckCircle size={15} />
                                  {prof.es_profesional_auditado_nueva_matricula
                                    ? "Validar Matrícula"
                                    : "Aprobar"}
                                </button>
                                <button
                                  onClick={() => abrirModalRechazo(prof)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95"
                                  title="Rechazar documentación y enviar motivo por email"
                                >
                                  <XCircle size={15} /> Rechazar
                                </button>
                              </div>
                            )}

                            {activeTab === "APROBADO" && (
                              <div className="inline-flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">
                                  <CheckCircle size={14} /> Validado
                                </span>
                                {prof.fecha_validacion && (
                                  <span className="text-[11px] text-gray-400 mt-1">
                                    {new Date(
                                      prof.fecha_validacion,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}

                            {activeTab === "RECHAZADO" && (
                              <div className="text-left max-w-xs ml-auto">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold mb-1.5">
                                  <XCircle size={14} /> Rechazado
                                </span>
                                <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-950 font-medium">
                                  <strong className="block text-[11px] uppercase tracking-wider text-rose-700 mb-0.5">
                                    Motivo del rechazo:
                                  </strong>
                                  {prof.motivo_rechazo ||
                                    "Documentación no legible o incompleta"}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        {activeTab === "REPORTES" && (
          <div className="space-y-6">
            {/* Barra de Filtros */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
                  Filtrar por estado:
                </span>
                {[
                  { id: "TODOS", label: "Todos los reportes" },
                  {
                    id: "PENDIENTE",
                    label: "Pendientes",
                    badge: reportesPendientesCount,
                  },
                  { id: "EN_REVISION", label: "En Revisión" },
                  { id: "RESUELTO_CON_SANCION", label: "Sancionados" },
                  { id: "DESESTIMADO", label: "Desestimados" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFiltroEstadoReporte(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${filtroEstadoReporte === f.id
                        ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    <span>{f.label}</span>
                    {Boolean(f.badge && f.badge > 0) && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-600 text-[10px] font-black">
                        {f.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-500 font-semibold">
                Total encontrados: <strong>{totalReportes}</strong>
              </div>
            </div>

            {/* Listado de Denuncias */}
            {cargandoReportes ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-500 font-medium border border-gray-100">
                <Loader2
                  size={32}
                  className="animate-spin text-rose-500 mx-auto mb-3"
                />
                Cargando denuncias y expedientes disciplinarios...
              </div>
            ) : reportes.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <CheckCircle
                  size={44}
                  className="mx-auto text-emerald-500 mb-3"
                />
                <h3 className="font-bold text-lg text-dark">
                  Sin denuncias registradas en esta categoría
                </h3>
                <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto">
                  {filtroEstadoReporte === "PENDIENTE"
                    ? "¡Excelente! No hay denuncias pendientes de resolución administrativa en este momento."
                    : "No se encontraron reportes formales bajo el filtro seleccionado."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reportes.map((rep) => {
                  const motivoConfig = MOTIVO_LABELS[rep.tipo_motivo] || {
                    label: rep.tipo_motivo,
                    icon: "⚠️",
                    desc: "Motivo tipificado",
                  };

                  return (
                    <div
                      key={rep.id}
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition space-y-4"
                    >
                      {/* Top Row: Estado, Motivo, Fecha */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Badge Estado */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${rep.estado === "PENDIENTE"
                                ? "bg-rose-50 text-[#EF4444] border border-rose-200"
                                : rep.estado === "EN_REVISION"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : rep.estado === "RESUELTO_CON_SANCION"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                          >
                            {rep.estado === "PENDIENTE" && (
                              <AlertTriangle size={13} />
                            )}
                            {rep.estado === "EN_REVISION" && (
                              <Clock size={13} />
                            )}
                            {rep.estado === "RESUELTO_CON_SANCION" && (
                              <Scale size={13} />
                            )}
                            {rep.estado === "DESESTIMADO" && (
                              <CheckCircle size={13} />
                            )}
                            <span>{rep.estado}</span>
                          </span>

                          {/* Motivo tipificado */}
                          <span className="px-3 py-1 rounded-xl bg-gray-50 border border-gray-200 text-dark text-xs font-bold flex items-center gap-1.5">
                            <span>{motivoConfig.icon}</span>
                            <span>{motivoConfig.label}</span>
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <Clock size={13} />
                          <span>
                            Radicado el {formatearFecha(rep.creado_en)}
                          </span>
                        </div>
                      </div>

                      {/* Denunciante vs Denunciado Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Denunciante */}
                        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {rep.denunciante.nombre.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                                Denunciante
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-semibold">
                                {rep.denunciante.rol}
                              </span>
                            </div>
                            <p className="font-bold text-dark text-sm truncate mt-0.5">
                              {rep.denunciante.nombre}{" "}
                              {rep.denunciante.apellido}
                            </p>
                            <p className="text-xs text-dark/60 truncate">
                              {rep.denunciante.email}
                            </p>
                            {rep.denunciante.telefono && (
                              <p className="text-[11px] text-gray-400">
                                Tel: {rep.denunciante.telefono}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Denunciado */}
                        <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#EF4444] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {rep.denunciado.nombre.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                                Denunciado
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-semibold">
                                {rep.denunciado.rol}
                              </span>
                            </div>
                            <p className="font-bold text-dark text-sm truncate mt-0.5">
                              {rep.denunciado.nombre} {rep.denunciado.apellido}
                            </p>
                            <p className="text-xs text-dark/60 truncate">
                              {rep.denunciado.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                                ⚡ Strikes: {rep.denunciado.strikes || 0}
                              </span>
                              {rep.denunciado.activo === false ? (
                                <span className="text-[11px] font-bold text-white bg-red-600 px-2 py-0.5 rounded">
                                  Cuenta Inactiva
                                </span>
                              ) : rep.denunciado.suspendido_hasta ? (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                  Suspendido
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Solicitud de Trabajo Contexto */}
                      {rep.solicitud && (
                        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl flex items-center gap-2">
                          <FileText
                            size={14}
                            className="text-primary shrink-0"
                          />
                          <span>
                            <strong>Solicitud Asociada:</strong>{" "}
                            {rep.solicitud.servicio?.titulo_servicio ||
                              `ID #${rep.solicitud.id.slice(0, 8)}`}
                          </span>
                          <span className="ml-auto px-2 py-0.5 rounded bg-gray-200 text-dark font-bold text-[10px]">
                            {rep.solicitud.estado_solicitud_trabajo}
                          </span>
                        </div>
                      )}

                      {/* Descripción del Hecho / Descargo */}
                      <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs text-dark leading-relaxed">
                        <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                          Hechos denunciados por el usuario:
                        </span>
                        <p className="italic font-medium">
                          "{rep.descripcion}"
                        </p>
                      </div>

                      {/* Dictamen Administrativo previo si ya está resuelto */}
                      {rep.resolucion_admin && (
                        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-purple-900 flex items-center gap-1">
                              <Scale size={14} /> Dictamen Administrativo
                              Emitido:
                            </span>
                            <span className="font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                              Sanción: {rep.sancion_aplicada}
                            </span>
                          </div>
                          <p className="text-purple-950 font-medium">
                            {rep.resolucion_admin}
                          </p>
                          {rep.admin_revisor && (
                            <p className="text-[10px] text-purple-700 mt-1 font-semibold">
                              Dictaminado por: {rep.admin_revisor.nombre}{" "}
                              {rep.admin_revisor.apellido}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Acciones del Reporte */}
                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => abrirModalAuditoria(rep)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-dark bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
                        >
                          <MessageSquare size={14} />
                          Ver Conversación Auditada
                        </button>

                        <button
                          onClick={() => abrirModalResolver(rep)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-700 transition flex items-center gap-1.5 shadow-sm shadow-rose-200"
                        >
                          <Scale size={14} />
                          {rep.estado === "PENDIENTE"
                            ? "Resolver Denuncia"
                            : "Re-auditar / Cambiar Sanción"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 5: BITÁCORA Y REGISTRO DE BLOQUEOS BILATERALES */}
        {activeTab === "BLOQUEOS" && (
          <div className="space-y-6">
            {/* Detección Preventiva de Reincidencia */}
            {reincidentes.length > 0 && (
              <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0">
                    <AlertOctagon size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-rose-950 text-sm sm:text-base flex items-center gap-2">
                      ⚠️ Detección Preventiva de Reincidencia (3 o más bloqueos
                      recibidos)
                    </h3>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Se detectaron usuarios con una tasa anómala de
                      conflictividad bilateral. Han sido bloqueados
                      reiteradamente por múltiples usuarios en la plataforma:
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {reincidentes.map((usr) => (
                        <div
                          key={usr.id}
                          className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-dark text-xs truncate">
                              {usr.nombre} {usr.apellido}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {usr.email} • {usr.rol}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                              <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                🚫 {usr.total_bloqueos_recibidos} bloqueos
                              </span>
                              <span className="text-gray-600 font-semibold">
                                ⚡ {usr.strikes || 0} strikes
                              </span>
                              {!usr.activo && (
                                <span className="text-white font-bold bg-red-600 px-1.5 py-0.5 rounded">
                                  Inactivo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bitácora Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-dark text-sm sm:text-base flex items-center gap-2">
                    <Ban size={18} className="text-[#EF4444]" />
                    Bitácora Histórica de Bloqueos
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Registro inalterable de todos los bloqueos emitidos entre
                    clientes y profesionales
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                  Total eventos: {totalBloqueos}
                </span>
              </div>

              {cargandoBloqueos ? (
                <div className="p-12 text-center text-gray-500 font-medium">
                  <Loader2
                    size={32}
                    className="animate-spin text-amber-500 mx-auto mb-3"
                  />
                  Cargando bitácora de bloqueos...
                </div>
              ) : bloqueos.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle
                    size={40}
                    className="mx-auto text-emerald-500 mb-3"
                  />
                  <p className="text-gray-700 font-bold text-base">
                    Sin bloqueos registrados en la plataforma
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Todos los intercambios se han desarrollado con normalidad.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-dark/70 uppercase tracking-wider font-bold">
                        <th className="p-4">Fecha y Hora</th>
                        <th className="p-4">Usuario Bloqueador</th>
                        <th className="p-4">Usuario Bloqueado</th>
                        <th className="p-4">Motivo Obligatorio</th>
                        <th className="p-4">Solicitud</th>
                        <th className="p-4 text-center">Estado Bloqueo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bloqueos.map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-gray-50/60 transition"
                        >
                          <td className="p-4 text-gray-500 whitespace-nowrap align-top">
                            {formatearFecha(b.fecha_bloqueo)}
                          </td>
                          <td className="p-4 align-top">
                            <div className="font-bold text-dark">
                              {b.bloqueador.nombre} {b.bloqueador.apellido}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {b.bloqueador.email} • {b.bloqueador.rol}
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="font-bold text-rose-700">
                              {b.bloqueado.nombre} {b.bloqueado.apellido}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {b.bloqueado.email} • {b.bloqueado.rol}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">
                                Strikes: {b.bloqueado.strikes || 0}
                              </span>
                              {!b.bloqueado.activo && (
                                <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                  Inactivo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-top max-w-xs">
                            <span className="font-medium text-dark leading-relaxed">
                              "{b.motivo}"
                            </span>
                          </td>
                          <td className="p-4 align-top">
                            {b.solicitud ? (
                              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                                {b.solicitud.estado_solicitud_trabajo}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">
                                No asociada
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-top text-center">
                            {b.activo ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-[#EF4444] border border-rose-200 rounded-lg text-xs font-bold">
                                <Ban size={12} /> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg text-xs font-semibold">
                                Inactivo
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {rejectModal && (
          <div
            className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isRejecting && setRejectModal(null)}
          >
            <div
              className="relative max-w-xl w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                    <XCircle size={26} />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-lg leading-tight">
                      {rejectModal.esNuevaMatricula
                        ? "Rechazar Documentación de Matrícula"
                        : "Rechazar Legajo de Profesional"}
                    </h3>
                    <p className="text-xs text-dark/60 mt-0.5">
                      Profesional:{" "}
                      <span className="font-bold text-dark">
                        {rejectModal.nombre}
                      </span>{" "}
                      ({rejectModal.email})
                      {rejectModal.esNuevaMatricula &&
                        rejectModal.oficiosPendientes && (
                          <span className="block text-orange-700 font-bold mt-0.5">
                            Oficio observado:{" "}
                            {rejectModal.oficiosPendientes.join(", ")} (su
                            cuenta continuará activa)
                          </span>
                        )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isRejecting && setRejectModal(null)}
                  disabled={isRejecting}
                  className="text-gray-400 hover:text-dark transition p-1.5 rounded-lg hover:bg-gray-100"
                  aria-label="Cerrar modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dark/70 mb-2">
                    Selecciona el motivo del rechazo:
                  </label>
                  <div className="space-y-2">
                    {MOTIVOS_PREDETERMINADOS.map((motivo, idx) => {
                      const isSelected = selectedMotivoIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedMotivoIndex(idx);
                            setRejectError(null);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center gap-3 ${isSelected
                              ? "border-rose-500 bg-rose-50/70 text-rose-950 font-semibold shadow-xs ring-1 ring-rose-200"
                              : "border-gray-200 bg-white hover:bg-gray-50/80 text-gray-700"
                            }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected
                                ? "border-rose-600 bg-rose-600"
                                : "border-gray-300 bg-white"
                              }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="flex-1">{motivo}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMotivoIndex("otro");
                        setRejectError(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center gap-3 ${selectedMotivoIndex === "otro"
                          ? "border-rose-500 bg-rose-50/70 text-rose-950 font-semibold shadow-xs ring-1 ring-rose-200"
                          : "border-gray-200 bg-white hover:bg-gray-50/80 text-gray-700"
                        }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedMotivoIndex === "otro"
                            ? "border-rose-600 bg-rose-600"
                            : "border-gray-300 bg-white"
                          }`}
                      >
                        {selectedMotivoIndex === "otro" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="flex-1 font-medium">
                        Otro motivo (escribir desde cero)
                      </span>
                    </button>
                  </div>
                </div>

                {selectedMotivoIndex === "otro" && (
                  <div className="pt-1 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-dark/80 mb-1.5">
                      Escribe el motivo detallado:
                    </label>
                    <textarea
                      rows={3}
                      value={customMotivo}
                      onChange={(e) => {
                        setCustomMotivo(e.target.value);
                        setRejectError(null);
                      }}
                      placeholder="Explica qué documento o requerimiento no cumple y cómo debe corregirlo para volver a postular..."
                      className="w-full p-3 border border-rose-300 rounded-xl text-xs sm:text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition resize-none bg-white"
                      autoFocus
                    />
                  </div>
                )}

                <div className="bg-gray-50/80 border border-gray-200/90 rounded-2xl p-4 text-xs text-dark/70">
                  <div className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-2 flex items-center justify-between">
                    <span>
                      Vista previa del correo que recibirá el profesional
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-[10px]">
                      ExpertoYa Mailer
                    </span>
                  </div>
                  <div className="bg-white border-l-4 border-rose-500 rounded-r-xl p-3.5 shadow-2xs">
                    <p className="font-bold text-gray-800 text-xs">
                      Motivo del rechazo:
                    </p>
                    <p className="text-blue-900 font-semibold text-xs mt-1 leading-relaxed">
                      {selectedMotivoIndex === "otro"
                        ? customMotivo.trim() ||
                        "(Escribe el motivo en el campo superior...)"
                        : MOTIVOS_PREDETERMINADOS[selectedMotivoIndex]}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 italic">
                    * El resto del formato del correo se mantiene intacto con el
                    diseño oficial de ExpertoYa.
                  </p>
                </div>

                {rejectError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{rejectError}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => !isRejecting && setRejectModal(null)}
                  disabled={isRejecting}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-dark hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarRechazo}
                  disabled={
                    isRejecting ||
                    (selectedMotivoIndex === "otro" && !customMotivo.trim())
                  }
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition flex items-center gap-2 shadow-sm shadow-rose-200"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Enviando notificación...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Enviar Rechazo y Notificar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {approveModal && (
          <div
            className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isApproving && setApproveModal(null)}
          >
            <div
              className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  <CheckCircle size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-dark text-lg leading-tight">
                    {approveModal.esNuevaMatricula
                      ? "Validar y Habilitar Matrícula"
                      : "Aprobar Profesional"}
                  </h3>
                  <p className="text-xs text-dark/60 mt-0.5">
                    {approveModal.esNuevaMatricula
                      ? "Aprobar documentación oficial de matrícula"
                      : "Activar perfil para recepción de clientes"}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-dark/70 mb-5 leading-relaxed">
                {approveModal.esNuevaMatricula ? (
                  <>
                    ¿Confirmas que la documentación de matrícula adjuntada por{" "}
                    <span className="font-bold text-dark">
                      {approveModal.nombre}
                    </span>{" "}
                    para{" "}
                    <strong className="text-orange-700">
                      {approveModal.oficiosPendientes?.join(", ") ||
                        "el nuevo oficio"}
                    </strong>{" "}
                    es válida y auténtica? El oficio quedará habilitado de
                    inmediato en su perfil profesional y se le enviará un correo
                    de confirmación.
                  </>
                ) : (
                  <>
                    ¿Confirmas que la documentación de{" "}
                    <span className="font-bold text-dark">
                      {approveModal.nombre}
                    </span>{" "}
                    cumple con todos los requisitos legales y fiscales? Su
                    perfil pasará a estado{" "}
                    <strong className="text-emerald-700">Validado</strong> y
                    recibirá el correo de confirmación habilitando su cuenta.
                  </>
                )}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => !isApproving && setApproveModal(null)}
                  disabled={isApproving}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-dark hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarAprobacion}
                  disabled={isApproving}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-sm shadow-emerald-200"
                >
                  {isApproving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      {approveModal.esNuevaMatricula
                        ? "Habilitar Oficio y Notificar"
                        : "Confirmar y Activar"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-md animate-in slide-in-from-bottom duration-300 ${toastMessage.tipo === "success"
                ? "bg-white border-emerald-200 text-emerald-950 shadow-emerald-100"
                : "bg-white border-rose-200 text-rose-950 shadow-rose-100"
              }`}
          >
            {toastMessage.tipo === "success" ? (
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            ) : (
              <XCircle size={20} className="text-rose-600 shrink-0" />
            )}
            <p className="text-xs font-semibold flex-1 leading-snug">
              {toastMessage.texto}
            </p>
            <button
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-dark p-1 rounded-md"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {previewDoc && (
          <div
            className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-white rounded-2xl p-4 shadow-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <h3 className="font-bold text-dark text-lg flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <span>{previewDoc.titulo}</span>
                  {previewDoc.profesional && (
                    <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                      {previewDoc.profesional}
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <ExternalLink size={14} /> Abrir en pestaña nueva
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="text-gray-400 hover:text-dark transition p-1"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-xl bg-gray-50 flex items-center justify-center min-h-[400px]">
                {previewDoc.esPdf ? (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.titulo}
                    className="w-full h-[65vh] rounded-xl border border-gray-200"
                  />
                ) : imgError ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                    <p className="font-bold text-gray-800">
                      No se pudo cargar la imagen del documento.
                    </p>
                    <p className="text-xs text-gray-400">
                      Verifica que el archivo exista en el servidor o utiliza el
                      botón superior para abrirlo en una pestaña nueva.
                    </p>
                  </div>
                ) : (
                  <img
                    key={previewDoc.url}
                    src={previewDoc.url}
                    alt={previewDoc.titulo}
                    className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-sm"
                    onError={() => setImgError(true)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
        {/* LOADER: AUDITORÍA DE CHAT */}
        {cargandoAuditChat && (
          <div className="fixed inset-0 bg-dark/40 z-50 flex items-center justify-center backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-[#EF4444]" />
              <span className="text-xs font-bold text-dark">
                Recuperando expediente y conversación auditada...
              </span>
            </div>
          </div>
        )}

        {/* MODAL: VER CONVERSACIÓN AUDITADA */}
        {modalAuditChat && (
          <div
            className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalAuditChat(null)}
          >
            <div
              className="relative max-w-3xl w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#EF4444] shrink-0">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-dark text-lg">
                        Auditoría de Conversación Oficial
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-gray-100 text-gray-700">
                        Exp. #{modalAuditChat.reporte.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-dark/60 mt-0.5">
                      Transcriptor oficial de mensajes para peritaje disciplinario
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalAuditChat(null)}
                  className="text-gray-400 hover:text-dark p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Banner de Antecedentes y Motivo */}
              <div className="my-4 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Denunciante:
                    </span>
                    <span className="font-bold text-dark text-sm">
                      {modalAuditChat.reporte.denunciante.nombre}{" "}
                      {modalAuditChat.reporte.denunciante.apellido}
                    </span>
                    <span className="text-gray-500 ml-1.5 font-medium">
                      ({modalAuditChat.reporte.denunciante.email}) •{" "}
                      {modalAuditChat.reporte.denunciante.rol}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Denunciado:
                    </span>
                    <span className="font-bold text-[#EF4444] text-sm">
                      {modalAuditChat.reporte.denunciado.nombre}{" "}
                      {modalAuditChat.reporte.denunciado.apellido}
                    </span>
                    <span className="text-gray-500 ml-1.5 font-medium">
                      ({modalAuditChat.reporte.denunciado.email}) •{" "}
                      {modalAuditChat.reporte.denunciado.rol}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 text-xs">
                  <span className="font-bold text-gray-700">
                    Motivo tipificado:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold">
                    {MOTIVO_LABELS[modalAuditChat.reporte.tipo_motivo]?.label ||
                      modalAuditChat.reporte.tipo_motivo}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">
                    Historial de denunciado:{" "}
                    <strong>{modalAuditChat.stats.reportes_previos}</strong>{" "}
                    denuncias previas,{" "}
                    <strong>{modalAuditChat.stats.bloqueos_recibidos}</strong>{" "}
                    bloqueos activos acumulados
                  </span>
                </div>

                <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-gray-200 text-gray-700 italic">
                  "{modalAuditChat.reporte.descripcion}"
                </div>
              </div>

              {/* Scroll de Mensajes Auditados */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[200px] max-h-[350px] p-3 bg-gray-100/60 rounded-2xl border border-gray-200/60">
                {modalAuditChat.mensajes.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    <MessageSquare
                      size={32}
                      className="mx-auto mb-2 opacity-50"
                    />
                    No hay mensajes de texto registrados en la sala de chat de esta solicitud.
                  </div>
                ) : (
                  modalAuditChat.mensajes.map((m) => {
                    const isDenunciado =
                      m.remitente_id === modalAuditChat.reporte.denunciado_id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isDenunciado ? "items-start" : "items-end"
                          }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-500">
                          <span className="font-bold text-dark">
                            {m.remitente.nombre} {m.remitente.apellido}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-200 font-semibold">
                            {m.remitente.rol}
                          </span>
                          <span>{formatearFecha(m.enviado_en)}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${isDenunciado
                              ? "bg-rose-50 text-rose-950 border border-rose-200 rounded-tl-sm"
                              : "bg-white text-gray-900 border border-gray-200 rounded-tr-sm"
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{m.contenido}</p>
                          {m.adjunto_url && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <button
                                onClick={() =>
                                  abrirDocumento(
                                    m.adjunto_url || null,
                                    "Adjunto del chat",
                                  )
                                }
                                className="text-primary hover:underline font-bold text-[11px] flex items-center gap-1"
                              >
                                <FileText size={12} /> Ver archivo adjunto
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                <button
                  onClick={() => setModalAuditChat(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cerrar Auditoría
                </button>

                <button
                  onClick={() => {
                    abrirModalResolver(modalAuditChat.reporte);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-700 rounded-xl transition flex items-center gap-2 shadow-sm shadow-rose-200"
                >
                  <Scale size={15} />
                  Dictaminar Sanción Disciplinaria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RESOLVER DENUNCIA Y DICTAMINAR SANCIÓN */}
        {modalResolver && (
          <div
            className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isResolving && setModalResolver(null)}
          >
            <div
              className="relative max-w-xl w-full bg-white rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#EF4444] shrink-0 shadow-2xs">
                    <Scale size={26} />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-lg leading-tight">
                      Resolución Administrativa de Denuncia
                    </h3>
                    <p className="text-xs text-dark/60 mt-0.5">
                      Expediente #{modalResolver.id.slice(0, 8)} contra{" "}
                      <strong className="text-[#EF4444]">
                        {modalResolver.denunciado.nombre}{" "}
                        {modalResolver.denunciado.apellido}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isResolving && setModalResolver(null)}
                  className="text-gray-400 hover:text-dark p-1 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 my-4 space-y-4 pr-1">
                <div>
                  <label className="block text-xs font-bold text-dark/80 mb-2">
                    Selecciona la sanción disciplinaria a aplicar:
                  </label>
                  <div className="space-y-2.5">
                    {[
                      {
                        id: "ADVERTENCIA",
                        titulo: "⚠️ Advertencia formal / Strike disciplinario",
                        desc: "Incrementa en 1 el contador de faltas del usuario. Recibe apercibimiento sin inhabilitación inmediata.",
                        border: "hover:border-amber-400",
                        active:
                          "border-amber-500 bg-amber-50/70 text-amber-950 ring-1 ring-amber-300",
                      },
                      {
                        id: "SUSPENSION_TEMPORAL",
                        titulo:
                          "⏳ Suspensión temporal de cuenta por 7 días",
                        desc: "Revoca de inmediato todas las sesiones activas y bloquea el acceso a la plataforma durante 7 días.",
                        border: "hover:border-orange-400",
                        active:
                          "border-orange-500 bg-orange-50/70 text-orange-950 ring-1 ring-orange-300",
                      },
                      {
                        id: "EXPULSION_DEFINITIVA",
                        titulo:
                          "🚫 Expulsión definitiva y desactivación permanente",
                        desc: "Inhabilita la cuenta permanentemente (activo = false), suspende perfil profesional y revoca accesos.",
                        border: "hover:border-rose-400",
                        active:
                          "border-[#EF4444] bg-rose-50/80 text-rose-950 ring-1 ring-rose-400",
                      },
                      {
                        id: "NINGUNA",
                        titulo: "🛡️ Desestimar denuncia sin sanción",
                        desc: "Concluye el expediente como infundado o falta no comprobada. No se aplican penalizaciones.",
                        border: "hover:border-gray-400",
                        active:
                          "border-gray-500 bg-gray-50/80 text-gray-900 ring-1 ring-gray-400",
                      },
                    ].map((op) => (
                      <div
                        key={op.id}
                        onClick={() => setSancionSeleccionada(op.id as any)}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${sancionSeleccionada === op.id
                            ? op.active
                            : `border-gray-200 bg-white text-gray-700 ${op.border}`
                          }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>{op.titulo}</span>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${sancionSeleccionada === op.id
                                ? "border-[#EF4444] bg-[#EF4444]"
                                : "border-gray-300"
                              }`}
                          >
                            {sancionSeleccionada === op.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          {op.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-dark/80 mb-1.5">
                    Dictamen o Fundamentación del Administrador (Obligatorio) *:
                  </label>
                  <textarea
                    rows={3}
                    value={resolucionTexto}
                    onChange={(e) => setResolucionTexto(e.target.value)}
                    placeholder="Detalla los motivos de la resolución disciplinaria basándote en la evidencia auditada..."
                    className="w-full p-3 border border-gray-300 rounded-xl text-xs sm:text-sm text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:border-transparent transition resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-800">
                  <AlertTriangle
                    size={15}
                    className="shrink-0 mt-0.5 text-amber-600"
                  />
                  <span>
                    El dictamen quedará permanentemente asentado en la bitácora administrativa de auditoría y se notificará en tiempo real al usuario sancionado.
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => !isResolving && setModalResolver(null)}
                  disabled={isResolving}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarResolucion}
                  disabled={isResolving || !resolucionTexto.trim()}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-sm shadow-rose-200"
                >
                  {isResolving ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Procesando Sanción...
                    </>
                  ) : (
                    <>
                      <Scale size={15} />
                      Confirmar Dictamen y Sancionar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
