import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ChatSession, UserRole } from '../../types/chat';
import {
  ArrowLeft,
  Video,
  ShieldCheck,
  Camera,
  Send,
  Check,
  CheckCheck,
  Clock,
  Lock,
  Loader2,
  MessageSquare,
  Sparkles,
  RefreshCw,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  Calendar,
  DollarSign,
  Wrench,
  CheckCircle2,
  Mic,
  Trash2,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import {
  isPropuestaVisita,
  parsePropuestaVisita,
  formatPropuestaVisita,
  isAudioAttachment,
  buildGoogleCalendarUrl,
  type PropuestaVisitaData,
} from '../../types/chat';
import { analizarSeguridadMensaje } from '../../utils/security';

interface Props {
  chat: ChatSession;
  activeRole: UserRole;
  isDark?: boolean;
  onBack?: () => void;
  onSendMessage?: (chatId: string, text: string) => void;
  onReleaseFunds?: (chatId: string) => void;
}

const getDefaultSuggestions = (role: UserRole) =>
  role === 'CLIENTE'
    ? [
      '¿A qué hora podrías pasar a revisar?',
      '¿Qué repuestos o materiales necesitarías?',
      '¡Genial, te espero entonces! Muchas gracias.',
    ]
    : [
      '¡Genial, la espero entonces!',
      'Estoy en camino al domicilio 🚗',
      'Llego en aproximadamente 15 minutos.',
    ];

export const ActiveConversation: React.FC<Props> = ({
  chat,
  activeRole,
  isDark = false,
  onBack,
  onReleaseFunds,
}) => {
  const { user, token } = useAuth();
  const [inputText, setInputText] = useState('');
  const [sugerencias, setSugerencias] = useState<string[]>(() =>
    getDefaultSuggestions(activeRole)
  );
  const [cargandoSugerencias, setCargandoSugerencias] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Cerrar lightbox con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const currentUserId = user?.id || (activeRole === 'CLIENTE' ? chat.client.id : chat.professional.id);

  // Hook de Socket.io en tiempo real y persistencia en PostgreSQL
  const {
    mensajes,
    cargando,
    bloqueado,
    estadoSolicitud,
    subiendoFoto,
    otroUsuarioEscribiendo,
    notificarEscribiendo,
    notificarDetuvoEscribiendo,
    enviarMensaje,
    subirArchivo,
    responderPropuesta,
  } = useChatSocket({
    solicitudId: chat.id,
    userId: currentUserId,
    token,
  });

  const [mostrarModalPropuesta, setMostrarModalPropuesta] = useState(false);
  const [formPropuesta, setFormPropuesta] = useState<{
    fecha: string;
    hora: string;
    presupuesto: string;
    materiales: string;
    nota: string;
  }>({
    fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    hora: '14:00 a 16:00 hs',
    presupuesto: chat.escrowAmount || '',
    materiales: '',
    nota: '',
  });

  // Estados de Seguridad y Antifraude (Mejora 5)
  const [mostrarModalSeguridad, setMostrarModalSeguridad] = useState(false);
  const [mostrarConfirmacionEnvioRiesgo, setMostrarConfirmacionEnvioRiesgo] = useState(false);
  const [mensajePendienteRiesgo, setMensajePendienteRiesgo] = useState<string | null>(null);

  // Estado de Grabación de Audio / Mensajes de Voz
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const iniciarGrabacion = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta grabación de audio.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setGrabandoAudio(true);
      setSegundosGrabacion(0);
      timerIntervalRef.current = setInterval(() => {
        setSegundosGrabacion((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error al acceder al micrófono:', err);
      alert('No se pudo acceder al micrófono. Por favor permite el acceso en el navegador.');
    }
  };

  const detenerYEnviarAudio = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const durationLabel = `🎤 Mensaje de voz (${Math.floor(segundosGrabacion / 60)}:${String(
        segundosGrabacion % 60
      ).padStart(2, '0')})`;
      subirArchivo(audioBlob, durationLabel);

      recorder.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    };

    recorder.stop();
    clearInterval(timerIntervalRef.current);
    setGrabandoAudio(false);
    setSegundosGrabacion(0);
  };

  const cancelarGrabacion = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    clearInterval(timerIntervalRef.current);
    audioChunksRef.current = [];
    setGrabandoAudio(false);
    setSegundosGrabacion(0);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const otherPerson =
    activeRole === 'CLIENTE' ? chat.professional : chat.client;

  const estaBloqueado =
    bloqueado ||
    estadoSolicitud === 'FINALIZADO' ||
    estadoSolicitud === 'DISPUTA' ||
    chat.status === 'COMPLETADO';

  const avatarUri =
    otherPerson.avatar && otherPerson.avatar.trim() !== ''
      ? otherPerson.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        otherPerson.name || 'Usuario'
      )}&background=283593&color=fff`;

  const [variacion, setVariacion] = useState(0);

  // Cargar sugerencias contextuales con IA
  const cargarSugerencias = useCallback(async (vOffset?: number) => {
    if (!chat.id || estaBloqueado) return;
    try {
      setCargandoSugerencias(true);
      const v = typeof vOffset === 'number' ? vOffset : variacion;
      const res = await fetch(`http://localhost:3000/api/chat/${chat.id}/sugerencias-ia?variacion=${v}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.sugerencias) && data.sugerencias.length > 0) {
          setSugerencias(data.sugerencias);
        }
      }
    } catch (err) {
      console.warn('Error al obtener sugerencias IA:', err);
    } finally {
      setCargandoSugerencias(false);
    }
  }, [chat.id, token, estaBloqueado, variacion]);

  useEffect(() => {
    cargarSugerencias();
  }, [cargarSugerencias, mensajes.length]);

  const handleRefreshSuggestions = () => {
    const nextVar = variacion + 1;
    setVariacion(nextVar);
    cargarSugerencias(nextVar);
  };

  const handleSelectSuggestion = (sug: string) => {
    setInputText(sug);
    textInputRef.current?.focus();
  };

  const handleEnviarPropuesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPropuesta.fecha || !formPropuesta.hora) {
      alert('Por favor indica al menos la fecha y el horario estimado.');
      return;
    }
    const payload = formatPropuestaVisita({
      fecha: formPropuesta.fecha,
      hora: formPropuesta.hora,
      presupuesto: formPropuesta.presupuesto.trim() || undefined,
      materiales: formPropuesta.materiales.trim() || undefined,
      nota: formPropuesta.nota.trim() || undefined,
      estado: 'PENDIENTE',
    });
    enviarMensaje(payload);
    setMostrarModalPropuesta(false);
    setFormPropuesta({
      fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      hora: '14:00 a 16:00 hs',
      presupuesto: chat.escrowAmount || '',
      materiales: '',
      nota: '',
    });
  };

  const [visitaConfirmadaModal, setVisitaConfirmadaModal] = useState<PropuestaVisitaData | null>(null);

  const handleConfirmarVisita = async (mensajeId: string, propuesta: PropuestaVisitaData) => {
    const confirmText = `✅ ¡Visita técnica confirmada! Acordamos para el ${propuesta.fecha} (${propuesta.hora}). Presupuesto: ${propuesta.presupuesto || 'A convenir'}.`;
    await responderPropuesta(mensajeId, 'ACEPTADA', confirmText);
    setVisitaConfirmadaModal(propuesta);
  };

  const handleAgregarGoogleCalendar = (propuesta: PropuestaVisitaData) => {
    const url = buildGoogleCalendarUrl(propuesta, otherPerson.name, otherPerson.profession);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePedirReprogramacion = async (mensajeId: string, propuesta: PropuestaVisitaData) => {
    const reprogramText = `🔄 Hola, he visto la propuesta para el ${propuesta.fecha} (${propuesta.hora}), pero necesitaría coordinar otro horario si es posible.`;
    await responderPropuesta(mensajeId, 'REPROGRAMAR', reprogramText);
  };

  // Auto-scroll hacia el final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, otroUsuarioEscribiendo]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || estaBloqueado) return;

    const riesgo = analizarSeguridadMensaje(inputText);
    if (riesgo.esRiesgoso) {
      setMensajePendienteRiesgo(inputText.trim());
      setMostrarConfirmacionEnvioRiesgo(true);
      return;
    }

    enviarMensajeConfirmado(inputText.trim());
  };

  const enviarMensajeConfirmado = (texto: string) => {
    notificarDetuvoEscribiendo();
    enviarMensaje(texto);
    setInputText('');
    setMensajePendienteRiesgo(null);
    setMostrarConfirmacionEnvioRiesgo(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      subirArchivo(file);
    }
    e.target.value = '';
  };

  const renderStatusTicks = (status?: string, leido?: boolean) => {
    if (leido || status === 'LEIDO') {
      return <CheckCheck className="w-3.5 h-3.5 text-white" />;
    }
    if (status === 'ENTREGADO') {
      return <CheckCheck className="w-3.5 h-3.5 text-yellow-200" />;
    }
    if (status === 'ENVIADO') {
      return <Check className="w-3.5 h-3.5 text-yellow-200" />;
    }
    if (status === 'ENVIANDO') {
      return <Clock className="w-3 h-3 text-gray-200 animate-spin" />;
    }
    return <CheckCheck className="w-3.5 h-3.5 text-white" />;
  };

  const hasEscrow = Boolean(
    chat.escrowAmount &&
    chat.escrowAmount !== '$0' &&
    chat.escrowAmount !== '0' &&
    chat.escrowAmount !== '$0.00'
  );

  return (
    <div
      className={`flex flex-col h-[750px] max-h-[85vh] w-full rounded-2xl sm:rounded-3xl border overflow-hidden shadow-lg transition-colors ${isDark
          ? 'bg-[#121826] border-gray-800'
          : 'bg-[#FDFCF4] border-gray-200/80'
        }`}
    >
      <header
        className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0 ${isDark
            ? 'bg-[#1F2937] border-gray-800 text-[#FDFCF4]'
            : 'bg-white border-gray-100 text-[#283593]'
          }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-[#283593] dark:text-[#FDFCF4] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
              aria-label="Volver al historial de chats"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={avatarUri}
              alt={otherPerson.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-black/5"
            />
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white dark:border-[#1F2937] rounded-full"
              title="En línea"
            />
          </div>

          <div className="min-w-0">
            <h2
              className={`font-bold text-base sm:text-lg leading-tight truncate ${isDark ? 'text-[#FDFCF4]' : 'text-[#283593]'
                }`}
            >
              {otherPerson.name}
            </h2>
            {otroUsuarioEscribiendo ? (
              <p className="text-xs font-semibold text-[#FF8C00] animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C00] inline-block animate-ping" />
                escribiendo...
              </p>
            ) : (
              <p
                className={`text-xs font-medium truncate ${isDark ? 'text-gray-400' : 'text-[#64748B]'
                  }`}
              >
                {otherPerson.profession}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => alert(`Iniciando llamada segura con ${otherPerson.name}...`)}
          className="p-2 sm:p-2.5 rounded-full text-[#00BFA5] hover:bg-[#00BFA5]/10 transition-colors cursor-pointer"
          aria-label="Iniciar videollamada"
        >
          <Video className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </header>

      {estaBloqueado && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Chat cerrado. La solicitud se encuentra en estado{' '}
            <strong className="font-bold">{estadoSolicitud || chat.status}</strong>. No se pueden enviar más mensajes.
          </span>
        </div>
      )}

      <div
        className={`flex items-center justify-between px-4 sm:px-6 py-2 border-b text-xs sm:text-sm font-semibold shrink-0 transition-colors ${chat.escrowStatus === 'RELEASED'
            ? isDark
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : hasEscrow
              ? isDark
                ? 'bg-[#00BFA5]/10 border-[#00BFA5]/20 text-[#33EFA5]'
                : 'bg-[#E8F8F5] border-[#B2DFDB] text-[#00897B]'
              : isDark
                ? 'bg-[#1e293b]/60 border-gray-800 text-slate-300'
                : 'bg-[#F0FDF4] border-emerald-100 text-[#065F46]'
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-emerald-500" />
          <span className="truncate">
            {chat.escrowStatus === 'RELEASED'
              ? `Fondos liberados con éxito (${chat.escrowAmount}).`
              : hasEscrow
                ? `Fondos en custodia garantizada (${chat.escrowAmount}).`
                : 'Conversación protegida por el sistema de Garantía Escrow ExpertoYa.'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMostrarModalSeguridad(true)}
            className="text-[11px] font-medium underline hover:text-[#FF8C00] transition-colors cursor-pointer flex items-center gap-1"
            title="Ver consejos para prevenir estafas y conservar tu garantía"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Consejos de seguridad</span>
            <span className="sm:hidden">Seguridad</span>
          </button>

          {activeRole === 'CLIENTE' && hasEscrow && chat.escrowStatus !== 'RELEASED' && onReleaseFunds && (
            <button
              onClick={() => {
                if (confirm(`¿Deseas confirmar la liberación de ${chat.escrowAmount} a ${otherPerson.name}?`)) {
                  onReleaseFunds(chat.id);
                }
              }}
              className="ml-2 px-3 py-1 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Liberar Fondos
            </button>
          )}
        </div>
      </div>

      <div
        className={`flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 ${isDark ? 'bg-[#121826]' : 'bg-[#FAF9F5]'
          }`}
      >
        {cargando ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF8C00]" />
            <span className="text-xs font-medium">Sincronizando mensajes...</span>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-500">
            <div className="w-14 h-14 rounded-full bg-[#FF8C00]/15 flex items-center justify-center text-[#FF8C00] mb-3">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#283593]'}`}>
              Comienza la conversación
            </h4>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {activeRole === 'CLIENTE'
                ? `Escribe tu mensaje a ${otherPerson.name} para coordinar los detalles del servicio.`
                : `Inicia la coordinación con ${otherPerson.name}.`}
            </p>
          </div>
        ) : (
          mensajes.map((msg) => {
            const isCurrentUser = msg.remitente_id === currentUserId;
            const timeStr = new Date(msg.enviado_en).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}
              >
                {!isCurrentUser && (
                  <img
                    src={avatarUri}
                    alt={otherPerson.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-1 ring-black/5"
                  />
                )}

                {isPropuestaVisita(msg.contenido) ? (
                  (() => {
                    const propuesta = parsePropuestaVisita(msg.contenido);
                    if (!propuesta) return null;
                    return (
                      <div
                        className={`w-full max-w-md sm:max-w-lg p-4 sm:p-5 rounded-2xl shadow-md border space-y-3 transition-all ${isDark
                            ? 'bg-[#1E293B] border-amber-500/40 text-white'
                            : 'bg-white border-amber-300 text-gray-800'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3 border-b pb-3 border-amber-200/50 dark:border-gray-700">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/15 flex items-center justify-center text-[#FF8C00] shrink-0">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm sm:text-base font-bold text-[#FF8C00]">
                                Visita Técnica & Presupuesto
                              </h4>
                              <p className="text-[11px] text-gray-400">
                                {isCurrentUser ? 'Propuesta enviada por ti' : `Propuesta de ${otherPerson.name}`}
                              </p>
                            </div>
                          </div>

                          <div>
                            {propuesta.estado === 'ACEPTADA' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmada
                              </span>
                            ) : propuesta.estado === 'REPROGRAMAR' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reprogramación
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                Pendiente
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                            <Calendar className="w-4 h-4 text-[#FF8C00] shrink-0" />
                            <div>
                              <span className="text-gray-400 block text-[10px]">Fecha</span>
                              <span className="font-semibold">{propuesta.fecha}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                            <Clock className="w-4 h-4 text-[#FF8C00] shrink-0" />
                            <div>
                              <span className="text-gray-400 block text-[10px]">Horario</span>
                              <span className="font-semibold">{propuesta.hora}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                            <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div>
                              <span className="text-gray-400 block text-[10px]">Presupuesto Est.</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {propuesta.presupuesto || 'A convenir'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                            <Wrench className="w-4 h-4 text-[#283593] dark:text-indigo-400 shrink-0" />
                            <div className="truncate">
                              <span className="text-gray-400 block text-[10px]">Materiales / Herram.</span>
                              <span className="font-semibold truncate block">
                                {propuesta.materiales || 'Insumos estándar'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {propuesta.nota && (
                          <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/40 text-xs">
                            <span className="text-amber-800 dark:text-amber-300 font-bold block text-[10px]">
                              Observaciones:
                            </span>
                            <p className="text-gray-600 dark:text-gray-300 mt-0.5">{propuesta.nota}</p>
                          </div>
                        )}

                        {propuesta.estado === 'PENDIENTE' ? (
                          !isCurrentUser ? (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleConfirmarVisita(msg.id, propuesta)}
                                className="flex-1 py-2 px-3 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Aceptar y Confirmar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePedirReprogramacion(msg.id, propuesta)}
                                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                              >
                                Solicitar Cambio
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-1 text-[11px] text-gray-400 italic">
                              Esperando respuesta de {otherPerson.name}...
                            </div>
                          )
                        ) : propuesta.estado === 'ACEPTADA' ? (
                          <div className="space-y-2 pt-0.5">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold text-center flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Visita técnica confirmada por ambas partes</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAgregarGoogleCalendar(propuesta)}
                              className="w-full py-2 px-3 bg-white dark:bg-gray-800 hover:bg-orange-50/70 dark:hover:bg-orange-950/30 text-[#FF8C00] dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer group active:scale-[0.98]"
                            >
                              <Calendar className="w-4 h-4 text-[#FF8C00] group-hover:scale-110 transition-transform" />
                              <span>Agregar a Google Calendar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300 font-semibold text-center flex items-center justify-center gap-1.5">
                            <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>Reprogramación solicitada en la conversación</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
                          <span>{timeStr}</span>
                          {isCurrentUser && renderStatusTicks(msg.status, msg.leido)}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div
                    className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl shadow-sm space-y-1.5 ${isCurrentUser
                        ? 'bg-[#FF8C00] text-white rounded-br-xs'
                        : isDark
                          ? 'bg-[#1F2937] text-[#FDFCF4] border border-gray-800 rounded-bl-xs'
                          : 'bg-white text-[#283593] border border-gray-100 rounded-bl-xs'
                      }`}
                  >
                    {isAudioAttachment(msg.adjunto_url, msg.contenido) ? (
                      <VoiceNotePlayer
                        audioUrl={msg.adjunto_url || ''}
                        isCurrentUser={isCurrentUser}
                        isDark={isDark}
                      />
                    ) : (
                      msg.adjunto_url && (
                        <div
                          className="relative group rounded-xl overflow-hidden mb-1.5 border border-black/10 cursor-pointer shadow-xs"
                          onClick={() => {
                            setSelectedImage(msg.adjunto_url!);
                            setZoomLevel(1);
                          }}
                          title="Hacer clic para ampliar en pantalla completa"
                        >
                          <img
                            src={msg.adjunto_url}
                            alt="Adjunto de trabajo"
                            className="max-h-56 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[1px]">
                            <Maximize2 className="w-4 h-4" />
                            <span>Ver foto completa</span>
                          </div>
                        </div>
                      )
                    )}

                    {msg.contenido && !isAudioAttachment(msg.adjunto_url, msg.contenido) && (
                      <div>
                        <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                          {msg.contenido}
                        </p>
                        {(() => {
                          const riesgo = analizarSeguridadMensaje(msg.contenido);
                          if (riesgo.esRiesgoso) {
                            return (
                              <div
                                className={`mt-2 p-2 rounded-lg text-[11px] leading-snug flex items-start gap-1.5 border shadow-2xs ${isCurrentUser
                                    ? 'bg-amber-500/25 border-amber-300/40 text-white'
                                    : isDark
                                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                                      : 'bg-amber-50 border-amber-200 text-amber-800'
                                  }`}
                              >
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                                <div>
                                  <span className="font-bold block">Aviso de seguridad:</span>
                                  <span>
                                    {riesgo.mensaje} Recuerda mantener pagos y acuerdos dentro de ExpertoYa para conservar la Garantía Escrow.
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-end gap-1.5 text-[10px] font-medium ${isCurrentUser
                          ? 'text-white/80'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-400'
                        }`}
                    >
                      <span>{timeStr}</span>
                      {isCurrentUser && renderStatusTicks(msg.status, msg.leido)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {otroUsuarioEscribiendo && (
          <div className="flex items-end gap-2.5 justify-start animate-in fade-in duration-300">
            <img
              src={avatarUri}
              alt={otherPerson.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ring-1 ring-black/5"
            />
            <div
              className={`px-4 py-3 rounded-2xl shadow-sm flex items-center gap-1.5 ${isDark
                  ? 'bg-[#1F2937] border border-gray-800'
                  : 'bg-white border border-gray-100'
                } rounded-bl-xs`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FF8C00] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-[#FF8C00] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-[#FF8C00] animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {!estaBloqueado && sugerencias.length > 0 && (
        <div
          className={`px-3 sm:px-4 py-2 border-t flex items-center gap-2 overflow-x-auto transition-colors ${isDark ? 'bg-[#1A2234] border-gray-800' : 'bg-orange-50/70 border-orange-100'
            }`}
        >
          <div className="flex items-center gap-1.5 shrink-0 text-[#FF8C00] font-bold text-xs select-none pr-1">
            <Sparkles className={`w-3.5 h-3.5 ${cargandoSugerencias ? 'animate-spin' : 'animate-pulse'}`} />
            <span className="hidden sm:inline">IA:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {sugerencias.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(sug)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs ${isDark
                    ? 'bg-[#121826] text-gray-200 border-gray-700 hover:border-[#FF8C00] hover:text-[#FF8C00]'
                    : 'bg-white text-gray-700 border-orange-200 hover:border-[#FF8C00] hover:text-[#FF8C00] hover:bg-orange-50'
                  }`}
                title="Hacer clic para editar en el campo de texto"
              >
                {sug}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRefreshSuggestions}
            disabled={cargandoSugerencias}
            className="p-1.5 rounded-full text-gray-400 hover:text-[#FF8C00] hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors ml-auto shrink-0 cursor-pointer"
            title="Generar nuevas sugerencias de IA"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargandoSugerencias ? 'animate-spin text-[#FF8C00]' : ''}`} />
          </button>
        </div>
      )}

      {!estaBloqueado && Boolean(inputText.trim()) && (() => {
        const riesgo = analizarSeguridadMensaje(inputText);
        if (!riesgo.esRiesgoso) return null;
        return (
          <div className="px-3 sm:px-4 py-2 bg-amber-500/15 dark:bg-amber-950/40 border-t border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-700 dark:text-amber-300">
                ⚠️ {riesgo.titulo}
              </span>
              <p className="mt-0.5 text-[11px] leading-tight opacity-95">
                {riesgo.mensaje} {riesgo.consejo}
              </p>
            </div>
          </div>
        );
      })()}

      <form
        onSubmit={handleSend}
        className={`p-3 sm:p-4 border-t flex items-center gap-2 sm:gap-3 shrink-0 ${estaBloqueado
            ? 'opacity-50 pointer-events-none'
            : ''
          } ${isDark ? 'bg-[#1F2937] border-gray-800' : 'bg-white border-gray-100'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={estaBloqueado || subiendoFoto}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={estaBloqueado || subiendoFoto}
          className="p-2 sm:p-2.5 rounded-full text-gray-400 hover:text-[#FF8C00] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Adjuntar fotografía de trabajo"
        >
          {subiendoFoto ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#FF8C00]" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMostrarModalPropuesta(true)}
          disabled={estaBloqueado}
          className="p-2 sm:p-2.5 rounded-full text-gray-400 hover:text-[#283593] dark:hover:text-[#60A5FA] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Coordinar Visita Técnica y Presupuesto"
        >
          <Calendar className="w-5 h-5" />
        </button>

        {grabandoAudio ? (
          /* Barra de Grabación en Progreso */
          <div className="flex-1 flex items-center justify-between gap-3 px-3.5 py-1.5 bg-red-500/10 dark:bg-red-950/30 border border-red-400/40 rounded-full animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                Grabando... {formatDuration(segundosGrabacion)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelarGrabacion}
                className="p-1.5 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                title="Descartar grabación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={detenerYEnviarAudio}
                className="p-1.5 rounded-full bg-[#10B981] hover:bg-[#059669] text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="Enviar mensaje de voz"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Campo de Texto Normal */
          <>
            <input
              ref={textInputRef}
              type="text"
              value={inputText}
              onChange={(e) => {
                const val = e.target.value;
                setInputText(val);
                if (val.trim().length > 0) {
                  notificarEscribiendo();
                } else {
                  notificarDetuvoEscribiendo();
                }
              }}
              onBlur={() => notificarDetuvoEscribiendo()}
              placeholder={
                estaBloqueado
                  ? 'Chat cerrado para esta solicitud'
                  : 'Escribe un mensaje...'
              }
              disabled={estaBloqueado}
              className={`flex-1 py-2 sm:py-2.5 px-4 text-sm rounded-full border outline-none transition-all ${isDark
                  ? 'bg-[#121826] border-gray-700 text-white placeholder-gray-500 focus:border-[#FF8C00]'
                  : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#FF8C00] focus:bg-white'
                }`}
            />

            {inputText.trim().length > 0 ? (
              <button
                type="submit"
                disabled={estaBloqueado}
                className="p-2.5 sm:p-3 rounded-full bg-[#FF8C00] hover:bg-[#E67E00] text-white shadow-md shadow-[#FF8C00]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={iniciarGrabacion}
                disabled={estaBloqueado}
                className="p-2.5 sm:p-3 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
                title="Grabar mensaje de voz"
                aria-label="Grabar mensaje de voz"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </form>

      {selectedImage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-black/92 backdrop-blur-md p-4 sm:p-6 transition-opacity animate-in fade-in duration-200 select-none"
            onClick={() => setSelectedImage(null)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100000] flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-sm rounded-full shadow-2xl transition-all cursor-pointer ring-2 ring-white/30"
              title="Cerrar visor (Esc)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
              <span>Cerrar</span>
            </button>

            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white shadow-2xl z-[99999] mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-bold px-2 py-1 rounded bg-black/40 text-amber-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-white"
                title="Tamaño 100%"
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-white/30 mx-1" />
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer text-white"
                title="Abrir imagen original en pestaña nueva"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div
              className="flex-1 w-full flex items-center justify-center overflow-auto my-2 p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Adjunto en pantalla completa"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                }}
                className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl shadow-2xl cursor-zoom-in"
                onClick={() => setZoomLevel((prev) => (prev > 1.2 ? 1 : 1.75))}
                title="Clic para alternar zoom (100% / 175%)"
              />
            </div>

            <div
              className="flex items-center gap-3 text-xs text-white/70 pb-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="hidden sm:inline">
                Haz clic en la imagen para alternar zoom, o presiona <strong>Escape</strong> para salir
              </span>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-colors cursor-pointer border border-white/20 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Salir de pantalla completa</span>
              </button>
            </div>
          </div>,
          document.body
        )}

      {mostrarModalPropuesta &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div
              className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 border space-y-4 ${isDark
                  ? 'bg-[#1E293B] border-gray-700 text-white'
                  : 'bg-white border-gray-200 text-gray-800'
                }`}
            >
              <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/15 flex items-center justify-center text-[#FF8C00]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#FF8C00]">
                      Coordinar Visita Técnica
                    </h3>
                    <p className="text-xs text-gray-400">
                      Formaliza fecha, horario y presupuesto en el chat
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModalPropuesta(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEnviarPropuesta} className="space-y-3.5 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
                      Fecha estimada de visita *
                    </label>
                    <input
                      type="date"
                      value={formPropuesta.fecha}
                      onChange={(e) =>
                        setFormPropuesta((prev) => ({ ...prev, fecha: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-[#FF8C00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
                      Rango horario de llegada *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 14:00 a 16:00 hs"
                      value={formPropuesta.hora}
                      onChange={(e) =>
                        setFormPropuesta((prev) => ({ ...prev, hora: e.target.value }))
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-[#FF8C00]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
                    Presupuesto estimado ($)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: $35.000 (Mano de obra + insumos)"
                    value={formPropuesta.presupuesto}
                    onChange={(e) =>
                      setFormPropuesta((prev) => ({ ...prev, presupuesto: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-[#FF8C00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
                    Herramientas y materiales a llevar
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Llaves térmicas, teflón, repuestos básicos"
                    value={formPropuesta.materiales}
                    onChange={(e) =>
                      setFormPropuesta((prev) => ({ ...prev, materiales: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-[#FF8C00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600 dark:text-gray-300">
                    Notas adicionales u observaciones
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Si llueve, coordinamos un rato antes de salir."
                    value={formPropuesta.nota}
                    onChange={(e) =>
                      setFormPropuesta((prev) => ({ ...prev, nota: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-[#FF8C00] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setMostrarModalPropuesta(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold bg-[#FF8C00] hover:bg-[#E67E00] text-white shadow-md shadow-[#FF8C00]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Propuesta Formal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {visitaConfirmadaModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  ¡Visita Técnica Confirmada!
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Coordinaste la visita con <strong className="text-gray-700 dark:text-gray-200">{otherPerson.name}</strong> para el{' '}
                  <strong className="text-[#FF8C00]">{visitaConfirmadaModal.fecha}</strong> ({visitaConfirmadaModal.hora}).
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Presupuesto:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{visitaConfirmadaModal.presupuesto || 'A convenir'}</span>
                </div>
                {visitaConfirmadaModal.materiales && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Insumos / Materiales:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200 text-right truncate max-w-[160px]">{visitaConfirmadaModal.materiales}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAgregarGoogleCalendar(visitaConfirmadaModal);
                    setVisitaConfirmadaModal(null);
                  }}
                  className="w-full py-2.5 px-4 bg-[#FF8C00] hover:bg-[#e07b00] text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agregar a Google Calendar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisitaConfirmadaModal(null)}
                  className="w-full py-2 px-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Continuar en el chat
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {mostrarModalSeguridad &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-500/30">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Garantía y Seguridad ExpertoYa</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModalSeguridad(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <h5 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                      1. Pago Protegido (Escrow)
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                      Tu dinero queda resguardado de forma segura en la plataforma y solo se libera al profesional cuando confirmás que el trabajo fue realizado a tu entera conformidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-xl">🚫</span>
                  <div>
                    <h5 className="font-bold text-amber-900 dark:text-amber-300 text-sm">
                      2. Nunca abones por fuera
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                      No realices transferencias a CBU/alias personales ni entregues pagos en efectivo fuera de la app. Los acuerdos externos <strong>anulan la garantía y el reembolso</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-xl">⚖️</span>
                  <div>
                    <h5 className="font-bold text-blue-900 dark:text-blue-300 text-sm">
                      3. Mediación y Soporte 24/7
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                      Todos los mensajes, fotos y notas de voz registrados en este chat constituyen respaldo oficial para que nuestro equipo de mediación intervenga ante cualquier disconformidad.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarModalSeguridad(false)}
                className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Entendido, mantener chat protegido
              </button>
            </div>
          </div>,
          document.body
        )}

      {mostrarConfirmacionEnvioRiesgo && mensajePendienteRiesgo &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-500/40">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-center text-gray-900 dark:text-white">
                Alerta de Seguridad Preventiva
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 text-center leading-relaxed">
                Detectamos datos de contacto o bancarios externos en tu mensaje.
              </p>

              <div className="mt-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 leading-normal">
                <strong>⚠️ Recordatorio importante:</strong> Los pagos y acuerdos acordados por fuera de ExpertoYa <strong>pierden la cobertura de la Garantía de Pago Protegido (Escrow)</strong> y el respaldo de mediación de disputas.
              </div>

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarConfirmacionEnvioRiesgo(false);
                    setMensajePendienteRiesgo(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Modificar Mensaje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mensajePendienteRiesgo) {
                      enviarMensajeConfirmado(mensajePendienteRiesgo);
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Enviar de todos modos
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
