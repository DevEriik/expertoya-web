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
} from "lucide-react";
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
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
  };
}

type TabType = "PENDIENTE" | "APROBADO" | "RECHAZADO";

interface RejectModalData {
  id: string;
  nombre: string;
  email: string;
}

interface ApproveModalData {
  id: string;
  nombre: string;
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
    if (!path) return null;
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
    if (!rawUrl) return;
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

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    // Carga inicial y recarga al cambiar de pestaña.
    // El setState ocurre dentro de la función async de fetch.
    cargarProfesionales(activeTab);
  }, [activeTab]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const abrirModalAprobar = (prof: ProfesionalAuditoria) => {
    setApproveModal({
      id: prof.id,
      nombre: `${prof.usuario.nombre} ${prof.usuario.apellido}`,
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
          texto: `¡Perfil de ${approveModal.nombre} aprobado y validado con éxito!`,
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
    setRejectModal({
      id: prof.id,
      nombre: `${prof.usuario.nombre} ${prof.usuario.apellido}`,
      email: prof.usuario.email,
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
          texto: `Solicitud de ${rejectModal.nombre} rechazada. Se envió la notificación con el motivo a su correo.`,
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
              Panel de Auditoría de Profesionales
            </h1>
            <p className="text-dark/60 mt-1">
              Revisión de identidad, situación fiscal y matrículas para
              activación de cuentas
            </p>
          </div>
          <button
            onClick={() => cargarProfesionales(activeTab)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-dark font-semibold text-sm rounded-xl transition"
          >
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

        <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("PENDIENTE")}
            className={`pb-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "PENDIENTE"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Solicitantes
          </button>
          <button
            onClick={() => setActiveTab("APROBADO")}
            className={`pb-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "APROBADO"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Auditados
          </button>
          <button
            onClick={() => setActiveTab("RECHAZADO")}
            className={`pb-3 px-5 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "RECHAZADO"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Rechazados
          </button>
        </div>

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
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="p-4 align-top">
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
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {prof.oficios && prof.oficios.length > 0 ? (
                            prof.oficios.map((oficio) => (
                              <span
                                key={oficio.id}
                                className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200/60 rounded-md text-xs font-semibold"
                              >
                                {oficio.nombre_oficio}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">
                              Sin oficios asignados
                            </span>
                          )}
                        </div>
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
                                  "Matrícula Habilitante",
                                  `${prof.usuario.nombre} ${prof.usuario.apellido}`,
                                )
                              }
                              className="col-span-2 text-left px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold rounded border border-orange-200 flex items-center gap-1"
                            >
                              <FileText size={12} /> Matrícula Habilitante
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-top text-right">
                        {activeTab === "PENDIENTE" && (
                          <div className="space-x-2 whitespace-nowrap inline-flex">
                            <button
                              onClick={() => abrirModalAprobar(prof)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95"
                              title="Aprobar legajo y activar profesional"
                            >
                              <CheckCircle size={15} /> Aprobar
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
                      Rechazar Legajo de Profesional
                    </h3>
                    <p className="text-xs text-dark/60 mt-0.5">
                      Profesional:{" "}
                      <span className="font-bold text-dark">
                        {rejectModal.nombre}
                      </span>{" "}
                      ({rejectModal.email})
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
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center gap-3 ${
                            isSelected
                              ? "border-rose-500 bg-rose-50/70 text-rose-950 font-semibold shadow-xs ring-1 ring-rose-200"
                              : "border-gray-200 bg-white hover:bg-gray-50/80 text-gray-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
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
                      className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center gap-3 ${
                        selectedMotivoIndex === "otro"
                          ? "border-rose-500 bg-rose-50/70 text-rose-950 font-semibold shadow-xs ring-1 ring-rose-200"
                          : "border-gray-200 bg-white hover:bg-gray-50/80 text-gray-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          selectedMotivoIndex === "otro"
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
                    Aprobar Profesional
                  </h3>
                  <p className="text-xs text-dark/60 mt-0.5">
                    Activar perfil para recepción de clientes
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-dark/70 mb-5 leading-relaxed">
                ¿Confirmas que la documentación de{" "}
                <span className="font-bold text-dark">
                  {approveModal.nombre}
                </span>{" "}
                cumple con todos los requisitos legales y fiscales? Su perfil
                pasará a estado{" "}
                <strong className="text-emerald-700">Validado</strong> y
                recibirá el correo de confirmación habilitando su cuenta.
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
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      Confirmar y Activar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl border flex items-center gap-3 max-w-md animate-in slide-in-from-bottom duration-300 ${
              toastMessage.tipo === "success"
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
      </section>
    </div>
  );
};
