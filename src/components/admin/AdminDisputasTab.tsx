import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Scale,
  ShieldAlert,
  UserX,
  X,
} from "lucide-react";

export interface DisputaAdminItem {
  id: string;
  solicitud_id: string;
  cliente_id: string | null;
  profesional_id: string | null;
  pago_id: string | null;
  motivo: string;
  descripcion: string | null;
  evidencia_urls: string[] | null;
  estado:
    | "ABIERTA"
    | "RESUELTA_CLIENTE"
    | "RESUELTA_REEMBOLSO_PARCIAL"
    | "RESUELTA_PROFESIONAL";
  monto_retenido: string | number | null;
  monto_reembolsado: string | number | null;
  resolucion_admin: string | null;
  resuelto_por: string | null;
  abierta_en: string;
  resuelta_en: string | null;
  solicitud?: {
    id: string;
    estado_solicitud_trabajo: string;
    descripcion: string;
    servicio?: {
      titulo_servicio: string;
      oficio?: { nombre_oficio: string };
    };
    cliente?: {
      id: string;
      nombre: string;
      apellido: string;
      email: string;
      telefono?: string | null;
    };
    profesional?: {
      id: string;
      usuario?: {
        id: string;
        nombre: string;
        apellido: string;
        email: string;
        telefono?: string | null;
        strikes?: number;
        suspendido_hasta?: string | null;
      };
    };
    pagos?: Array<{
      id: string;
      monto_total: string | number;
      neto_profesional: string | number;
      comision_plataforma: string | number;
      estado_pago: string;
      transaccion_mp_id?: string | null;
    }>;
  } | null;
}

interface MensajeAuditado {
  id: string;
  contenido: string;
  enviado_en: string;
  remitente_id: string;
  adjunto_url?: string | null;
  remitente: {
    id: string;
    nombre: string;
    apellido: string;
    rol: string;
  };
}

type DecisionDisputa =
  | "REEMBOLSO_TOTAL"
  | "REEMBOLSO_PARCIAL"
  | "LIBERAR_PROFESIONAL";

interface AdminDisputasTabProps {
  disputas: DisputaAdminItem[];
  cargando: boolean;
  filtroEstado: string;
  onChangeFiltro: (nuevoFiltro: string) => void;
  onRecargar: () => void;
  onNotify: (tipo: "success" | "error", texto: string) => void;
}

const formatearFecha = (fechaStr?: string | null) => {
  if (!fechaStr) return "-";
  try {
    return new Date(fechaStr).toLocaleString("es-AR", {
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

const formatearARS = (valor?: string | number | null) => {
  const n = Number(valor ?? 0);
  if (!Number.isFinite(n)) return `$ ${valor ?? "0.00"}`;
  return `$ ${n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const AdminDisputasTab = ({
  disputas,
  cargando,
  filtroEstado,
  onChangeFiltro,
  onRecargar,
  onNotify,
}: AdminDisputasTabProps) => {
  // Aviso destacado al emitir una resolución
  const [avisoResolucion, setAvisoResolucion] = useState<{
    titulo: string;
    detalle: string;
  } | null>(null);

  // Modal de chat en modo solo lectura
  const [modalChat, setModalChat] = useState<{
    disputa: DisputaAdminItem;
    mensajes: MensajeAuditado[];
  } | null>(null);
  const [cargandoChat, setCargandoChat] = useState(false);

  // Modal de resolución financiera + suspensión por mala fe
  const [modalResolver, setModalResolver] = useState<DisputaAdminItem | null>(
    null,
  );
  const [decision, setDecision] = useState<DecisionDisputa>("REEMBOLSO_TOTAL");
  const [montoParcial, setMontoParcial] = useState<string>("");
  const [justificacion, setJustificacion] = useState<string>("");
  const [suspenderMalaFe, setSuspenderMalaFe] = useState<boolean>(false);
  const [diasSuspension, setDiasSuspension] = useState<number>(7);
  const [resolviendo, setResolviendo] = useState<boolean>(false);

  const abiertasCount = disputas.filter((d) => d.estado === "ABIERTA").length;

  const abrirChatSoloLectura = async (disputa: DisputaAdminItem) => {
    setCargandoChat(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://expertoya-backend.onrender.com/api/disputas/admin/${disputa.id}/chat`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        onNotify(
          "error",
          err.error || "No se pudo recuperar el historial del chat.",
        );
        return;
      }
      const data = await res.json();
      setModalChat({
        disputa: data.disputa || disputa,
        mensajes: data.mensajes || [],
      });
    } catch {
      onNotify("error", "Error de red al auditar la conversación.");
    } finally {
      setCargandoChat(false);
    }
  };

  const abrirModalDictamen = (disputa: DisputaAdminItem) => {
    const retenido = Number(
      disputa.monto_retenido ?? disputa.solicitud?.pagos?.[0]?.monto_total ?? 0,
    );
    setModalResolver(disputa);
    setDecision("REEMBOLSO_TOTAL");
    setMontoParcial(retenido > 0 ? (retenido / 2).toFixed(2) : "");
    setJustificacion("");
    setSuspenderMalaFe(false);
    setDiasSuspension(7);
  };

  const confirmarDictamenDisputa = async () => {
    if (!modalResolver) return;
    if (!justificacion.trim()) {
      onNotify("error", "Debes ingresar la justificación de la resolución.");
      return;
    }

    const retenido = Number(
      modalResolver.monto_retenido ??
        modalResolver.solicitud?.pagos?.[0]?.monto_total ??
        0,
    );

    if (decision === "REEMBOLSO_PARCIAL") {
      const parcialNum = Number(montoParcial);
      if (
        !Number.isFinite(parcialNum) ||
        parcialNum <= 0 ||
        parcialNum >= retenido
      ) {
        onNotify(
          "error",
          `El reembolso parcial debe ser mayor a $0 y menor al total retenido (${formatearARS(retenido)}).`,
        );
        return;
      }
    }

    setResolviendo(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://expertoya-backend.onrender.com/api/disputas/admin/${modalResolver.id}/resolver`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision,
            monto_reembolsado:
              decision === "REEMBOLSO_PARCIAL"
                ? Number(montoParcial)
                : undefined,
            resolucion_admin: justificacion.trim(),
            suspender_profesional: suspenderMalaFe,
            dias_suspension: suspenderMalaFe ? diasSuspension : 0,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onNotify("error", data.error || "No se pudo procesar la resolución.");
        return;
      }

      const resumenDecision =
        decision === "REEMBOLSO_TOTAL"
          ? "Devolución total (100%) al cliente"
          : decision === "REEMBOLSO_PARCIAL"
            ? `Devolución parcial (${formatearARS(montoParcial)}) al cliente`
            : "Liberación de fondos al profesional";

      setAvisoResolucion({
        titulo: "Resolución emitida y enviada al cliente y al profesional",
        detalle: `Dictamen aplicado: ${resumenDecision}. Se envió el mensaje oficial con la resolución y fundamentación a los perfiles del cliente y del profesional.`,
      });

      onNotify(
        "success",
        `Resolución enviada al perfil del cliente y del profesional (${resumenDecision}).`,
      );
      setModalResolver(null);
      if (modalChat) setModalChat(null);
      onRecargar();
    } catch {
      onNotify("error", "Error de conexión al resolver la disputa.");
    } finally {
      setResolviendo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso de confirmación al emitir dictamen */}
      {avisoResolucion && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">
                {avisoResolucion.titulo}
              </p>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                {avisoResolucion.detalle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAvisoResolucion(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-lg"
            aria-label="Cerrar aviso de resolución"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Alerta destacada si hay disputas abiertas */}
      {abiertasCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EF4444] text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="font-bold text-rose-950 text-sm">
                Atención: {abiertasCount}{" "}
                {abiertasCount === 1
                  ? "reclamo con fondos en garantía congelados"
                  : "reclamos con fondos en garantía congelados"}
              </p>
              <p className="text-xs text-rose-800">
                Audita el historial del chat y emite un dictamen para
                desbloquear la transacción (devolución al cliente o liberación
                al profesional).
              </p>
            </div>
          </div>
          <button
            onClick={onRecargar}
            className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw size={14} /> Sincronizar
          </button>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            Estado del reclamo:
          </span>
          {[
            { id: "TODOS", label: "Todos" },
            {
              id: "ABIERTA",
              label: "Abiertas (Congeladas)",
              badge: abiertasCount,
            },
            { id: "RESUELTA_CLIENTE", label: "Reembolso Total" },
            { id: "RESUELTA_REEMBOLSO_PARCIAL", label: "Reembolso Parcial" },
            { id: "RESUELTA_PROFESIONAL", label: "Liberado al Pro" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => onChangeFiltro(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filtroEstado === f.id
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
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

        <span className="text-xs text-gray-500 font-semibold">
          Total expedientes: <strong>{disputas.length}</strong>
        </span>
      </div>

      {/* Listado de Disputas */}
      {cargando ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 font-medium border border-gray-100">
          <Loader2
            size={32}
            className="animate-spin text-rose-500 mx-auto mb-3"
          />
          Cargando disputas y transacciones en custodia...
        </div>
      ) : disputas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <CheckCircle size={44} className="mx-auto text-emerald-500 mb-3" />
          <h3 className="font-bold text-lg text-dark">
            No hay disputas en esta categoría
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            Todos los pagos en custodia operan sin reclamos pendientes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {disputas.map((d) => {
            const cliente = d.solicitud?.cliente;
            const proUser = d.solicitud?.profesional?.usuario;
            const pago = d.solicitud?.pagos?.[0];
            const montoRetenido = d.monto_retenido ?? pago?.monto_total ?? 0;
            const abierta = d.estado === "ABIERTA";

            return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition space-y-4 ${
                  abierta
                    ? "border-rose-200 ring-1 ring-rose-100"
                    : "border-gray-100"
                }`}
              >
                {/* Cabecera */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                        abierta
                          ? "bg-rose-50 text-[#EF4444] border border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {abierta ? <Lock size={13} /> : <CheckCircle size={13} />}
                      <span>{d.estado}</span>
                    </span>

                    <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
                      <DollarSign size={13} className="text-amber-600" />
                      <span>Custodia: {formatearARS(montoRetenido)}</span>
                    </span>

                    {d.monto_reembolsado != null &&
                      Number(d.monto_reembolsado) > 0 && (
                        <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                          Reembolsado: {formatearARS(d.monto_reembolsado)}
                        </span>
                      )}
                  </div>

                  <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <Clock size={13} />
                    <span>Abierta el {formatearFecha(d.abierta_en)}</span>
                  </div>
                </div>

                {/* Partes involucradas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Cliente Reclamante
                    </span>
                    <p className="font-bold text-dark text-sm mt-0.5">
                      {cliente
                        ? `${cliente.nombre} ${cliente.apellido}`
                        : "Cliente"}
                    </p>
                    <p className="text-xs text-dark/60">{cliente?.email}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                        Profesional Auditado
                      </span>
                      {proUser?.suspendido_hasta && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          Suspendido hasta{" "}
                          {formatearFecha(proUser.suspendido_hasta)}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-dark text-sm mt-0.5">
                      {proUser
                        ? `${proUser.nombre} ${proUser.apellido}`
                        : "Profesional"}
                    </p>
                    <p className="text-xs text-dark/60">{proUser?.email}</p>
                  </div>
                </div>

                {/* Servicio + Motivo */}
                <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-dark flex items-center gap-1.5">
                      <FileText size={14} className="text-primary" />
                      Servicio:{" "}
                      {d.solicitud?.servicio?.titulo_servicio ||
                        `Solicitud #${d.solicitud_id.slice(0, 8)}`}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                      Motivo: {d.motivo}
                    </span>
                  </div>
                  {d.descripcion && (
                    <p className="text-gray-700 italic pt-1">
                      "{d.descripcion}"
                    </p>
                  )}
                </div>

                {/* Dictamen emitido si ya se resolvió */}
                {d.resolucion_admin && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                    <span className="font-bold text-emerald-900 block mb-1">
                      Dictamen de Moderación ({formatearFecha(d.resuelta_en)}):
                    </span>
                    <p className="text-emerald-950 font-medium">
                      {d.resolucion_admin}
                    </p>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => abrirChatSoloLectura(d)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-dark bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    Leer Historial del Chat (Solo Lectura)
                  </button>

                  {abierta && (
                    <button
                      onClick={() => abrirModalDictamen(d)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-700 transition flex items-center gap-1.5 shadow-sm shadow-rose-200"
                    >
                      <Scale size={14} />
                      Resolver Disputa y Fondos
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LOADER CHAT */}
      {cargandoChat && (
        <div className="fixed inset-0 bg-dark/40 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-[#EF4444]" />
            <span className="text-xs font-bold text-dark">
              Cargando transcripción del chat en modo solo lectura...
            </span>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DEL CHAT EN MODO SOLO LECTURA */}
      {modalChat && (
        <div
          className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setModalChat(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-dark text-lg">
                    Historial del Chat — Modo Solo Lectura
                  </h3>
                  <p className="text-xs text-gray-500">
                    Disputa #{modalChat.disputa.id.slice(0, 8)} · Evidencia
                    inalterable entre cliente y profesional
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalChat(null)}
                className="text-gray-400 hover:text-dark p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 p-4 bg-gray-100/70 rounded-2xl border border-gray-200 space-y-3 min-h-[240px]">
              {modalChat.mensajes.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No existen mensajes registrados en esta conversación.
                </div>
              ) : (
                modalChat.mensajes.map((m) => {
                  const esClienteMsg = m.remitente.rol === "CLIENTE";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        esClienteMsg ? "items-start" : "items-end"
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
                        className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                          esClienteMsg
                            ? "bg-white text-gray-900 border border-gray-200 rounded-tl-sm"
                            : "bg-blue-50 text-blue-950 border border-blue-200 rounded-tr-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.contenido}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Lock size={12} /> Canal cerrado de auditoría (sin envío de
                mensajes)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalChat(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cerrar
                </button>
                {modalChat.disputa.estado === "ABIERTA" && (
                  <button
                    onClick={() => abrirModalDictamen(modalChat.disputa)}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Scale size={14} /> Emitir Resolución
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVER DISPUTA Y REEMBOLSOS */}
      {modalResolver && (
        <div
          className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => !resolviendo && setModalResolver(null)}
        >
          <div
            className="relative max-w-xl w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#EF4444] shrink-0">
                  <Scale size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-dark text-lg">
                    Dictamen Financiero y Moderación
                  </h3>
                  <p className="text-xs text-gray-500">
                    Fondos en custodia:{" "}
                    <strong className="text-dark">
                      {formatearARS(
                        modalResolver.monto_retenido ??
                          modalResolver.solicitud?.pagos?.[0]?.monto_total,
                      )}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => !resolviendo && setModalResolver(null)}
                className="text-gray-400 hover:text-dark p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-4 px-1.5">
              <div>
                <label className="block text-xs font-bold text-dark/80 mb-2">
                  Destino de los fondos retenidos:
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: "REEMBOLSO_TOTAL",
                      titulo: "Devolución Total al Cliente (100%)",
                      desc: "Reembolsa el total retenido al cliente y cancela la solicitud.",
                    },
                    {
                      id: "REEMBOLSO_PARCIAL",
                      titulo: "Devolución Parcial al Cliente",
                      desc: "Devuelve un monto acordado al cliente y libera el remanente neto.",
                    },
                    {
                      id: "LIBERAR_PROFESIONAL",
                      titulo: "Fallar a favor del Profesional (Liberar Pago)",
                      desc: "Desestima el reclamo y habilita la liberación del pago al profesional.",
                    },
                  ].map((op) => (
                    <div
                      key={op.id}
                      onClick={() => setDecision(op.id as DecisionDisputa)}
                      className={`p-3 rounded-2xl border-2 text-xs cursor-pointer transition ${
                        decision === op.id
                          ? "border-[#EF4444] bg-rose-50/70 text-rose-950"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <p className="font-bold">{op.titulo}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {op.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {decision === "REEMBOLSO_PARCIAL" && (
                <div>
                  <label className="block text-xs font-bold text-dark/80 mb-1">
                    Monto a reembolsar al cliente (ARS) *:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={montoParcial}
                    onChange={(e) => setMontoParcial(e.target.value)}
                    placeholder="Ej: 15000"
                    className="w-full p-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-dark focus:outline-none focus:border-[#EF4444]"
                  />
                </div>
              )}

              {/* Suspensión temporal por mala fe */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={suspenderMalaFe}
                    onChange={(e) => setSuspenderMalaFe(e.target.checked)}
                    className="rounded border-amber-400 text-[#EF4444] focus:ring-[#EF4444]"
                  />
                  <UserX size={16} className="text-amber-700 shrink-0" />
                  <span>
                    Aplicar suspensión temporal al profesional por mala fe
                  </span>
                </label>

                {suspenderMalaFe && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-xs text-amber-900 font-medium">
                      Duración de suspensión:
                    </span>
                    <select
                      value={diasSuspension}
                      onChange={(e) =>
                        setDiasSuspension(Number(e.target.value))
                      }
                      className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white text-xs font-bold text-dark"
                    >
                      <option value={3}>3 días</option>
                      <option value={7}>7 días</option>
                      <option value={15}>15 días</option>
                      <option value={30}>30 días</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-dark/80 mb-1">
                  Justificación del Dictamen (Obligatorio) *:
                </label>
                <textarea
                  rows={3}
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  placeholder="Explica la resolución basándote en los mensajes auditados y las condiciones del servicio..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-xs sm:text-sm text-dark focus:outline-none focus:border-[#EF4444] resize-none transition"
                />
              </div>

              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-2 text-[11px] text-gray-600">
                <AlertTriangle
                  size={14}
                  className="shrink-0 mt-0.5 text-amber-600"
                />
                <span>
                  Esta acción actualizará el estado del pago escrow, registrará
                  el dictamen en auditoría y enviará la notificación oficial a
                  ambas partes.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => !resolviendo && setModalResolver(null)}
                disabled={resolviendo}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarDictamenDisputa}
                disabled={resolviendo || !justificacion.trim()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#EF4444] hover:bg-rose-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-sm shadow-rose-200"
              >
                {resolviendo ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Ejecutando dictamen...
                  </>
                ) : (
                  <>
                    <Scale size={15} />
                    Confirmar Resolución
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
