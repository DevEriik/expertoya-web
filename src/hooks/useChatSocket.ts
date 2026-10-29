import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { MensajeChatModel } from '../types/chat';

const API_BASE_URL = 'http://localhost:3000';

interface UseChatSocketParams {
  solicitudId: string;
  userId: string;
  token?: string | null;
}

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const useChatSocket = ({ solicitudId, userId, token }: UseChatSocketParams) => {
  const [mensajes, setMensajes] = useState<MensajeChatModel[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [bloqueado, setBloqueado] = useState<boolean>(false);
  const [estadoSolicitud, setEstadoSolicitud] = useState<string>('');
  const [subiendoFoto, setSubiendoFoto] = useState<boolean>(false);
  const [otroUsuarioEscribiendo, setOtroUsuarioEscribiendo] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const typingSafetyTimeoutRef = useRef<any>(null);
  const typingDebounceTimeoutRef = useRef<any>(null);

  const esSolicitudReal = isUUID(solicitudId);

  const cargarHistorial = useCallback(async () => {
    if (!solicitudId) return;

    if (!esSolicitudReal) {
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const res = await fetch(`${API_BASE_URL}/api/chat/${solicitudId}/mensajes`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Error al recuperar mensajes: ${res.status}`);
      }

      const data = await res.json();
      setBloqueado(Boolean(data.bloqueado));
      setEstadoSolicitud(data.estado_solicitud || '');

      const mapeados: MensajeChatModel[] = (data.mensajes || []).map((m: any) => ({
        id: m.id,
        solicitud_id: m.solicitud_id,
        remitente_id: m.remitente_id,
        contenido: m.contenido,
        adjunto_url: m.adjunto_url,
        enviado_en: m.enviado_en,
        leido: m.leido,
        status: m.leido ? 'LEIDO' : 'ENTREGADO',
      }));

      setMensajes(mapeados);
    } catch (error) {
      console.error('Error al cargar historial del chat:', error);
    } finally {
      setCargando(false);
    }
  }, [solicitudId, token, esSolicitudReal]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  useEffect(() => {
    if (!solicitudId || !token || !esSolicitudReal || !userId) {
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 [Web] Socket conectado al chat:', socket.id);
      socket.emit('join_solicitud', { solicitud_id: solicitudId });
    });

    socket.on('chat_unido', (data: { solicitud_id: string; bloqueado: boolean; estado_solicitud: string }) => {
      if (data.bloqueado) {
        setBloqueado(true);
      }
      setEstadoSolicitud(data.estado_solicitud || '');
    });

    socket.on('nuevo_mensaje', (nuevoMsg: any) => {
      setMensajes((prev) => {
        if (nuevoMsg.remitente_id === userId) {
          const matchIndex = prev.findIndex(
            (m) =>
              m.id === nuevoMsg.temp_id ||
              m.id === nuevoMsg.id ||
              (m.status === 'ENVIANDO' && m.contenido === nuevoMsg.contenido)
          );

          if (matchIndex !== -1) {
            const updated = [...prev];
            updated[matchIndex] = {
              id: nuevoMsg.id,
              solicitud_id: nuevoMsg.solicitud_id,
              remitente_id: nuevoMsg.remitente_id,
              contenido: nuevoMsg.contenido,
              adjunto_url: nuevoMsg.adjunto_url,
              enviado_en: nuevoMsg.enviado_en,
              leido: nuevoMsg.leido,
              status: nuevoMsg.leido ? 'LEIDO' : 'ENVIADO',
            };
            return updated;
          }

          if (prev.some((m) => m.id === nuevoMsg.id)) return prev;

          return [
            ...prev,
            {
              id: nuevoMsg.id,
              solicitud_id: nuevoMsg.solicitud_id,
              remitente_id: nuevoMsg.remitente_id,
              contenido: nuevoMsg.contenido,
              adjunto_url: nuevoMsg.adjunto_url,
              enviado_en: nuevoMsg.enviado_en,
              leido: nuevoMsg.leido,
              status: 'ENVIADO',
            },
          ];
        }

        if (prev.some((m) => m.id === nuevoMsg.id)) {
          return prev;
        }
        setOtroUsuarioEscribiendo(false);
        if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);

        socket.emit('confirmar_entrega', {
          mensaje_id: nuevoMsg.id,
          solicitud_id: solicitudId,
        });

        socket.emit('marcar_leido', {
          solicitud_id: solicitudId,
        });

        const recibido: MensajeChatModel = {
          id: nuevoMsg.id,
          solicitud_id: nuevoMsg.solicitud_id,
          remitente_id: nuevoMsg.remitente_id,
          contenido: nuevoMsg.contenido,
          adjunto_url: nuevoMsg.adjunto_url,
          enviado_en: nuevoMsg.enviado_en,
          leido: true,
          status: 'ENTREGADO',
        };

        return [...prev, recibido];
      });
    });

    socket.on('mensaje_entregado', ({ mensaje_id }: { mensaje_id: string }) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === mensaje_id && m.status !== 'LEIDO'
            ? { ...m, status: 'ENTREGADO' }
            : m
        )
      );
    });

    socket.on('mensajes_leidos', ({ leido_por }: { solicitud_id: string; leido_por: string }) => {
      if (leido_por !== userId) {
        setMensajes((prev) =>
          prev.map((m) =>
            m.remitente_id === userId ? { ...m, leido: true, status: 'LEIDO' } : m
          )
        );
      }
    });

    socket.on('usuario_escribiendo', (data: { solicitud_id: string; usuario_id: string }) => {
      if (data.solicitud_id === solicitudId && data.usuario_id !== userId) {
        setOtroUsuarioEscribiendo(true);
        if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);
        typingSafetyTimeoutRef.current = setTimeout(() => {
          setOtroUsuarioEscribiendo(false);
        }, 4000);
      }
    });

    socket.on('usuario_detuvo_escribiendo', (data: { solicitud_id: string; usuario_id: string }) => {
      if (data.solicitud_id === solicitudId && data.usuario_id !== userId) {
        setOtroUsuarioEscribiendo(false);
        if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);
      }
    });

    socket.on('chat_bloqueado', (data: { solicitud_id: string; motivo: string }) => {
      setBloqueado(true);
      alert(data.motivo || 'El chat ha sido cerrado.');
    });
    socket.on('propuesta_actualizada', (data: { mensaje_id: string; contenido: string; nuevo_estado: string }) => {
      setMensajes((prev) =>
        prev.map((m) =>
          m.id === data.mensaje_id ? { ...m, contenido: data.contenido } : m
        )
      );
    });

    socket.on('error_chat', (err: { mensaje: string }) => {
      console.warn('Socket error_chat:', err.mensaje);
    });

    return () => {
      if (typingSafetyTimeoutRef.current) clearTimeout(typingSafetyTimeoutRef.current);
      if (typingDebounceTimeoutRef.current) clearTimeout(typingDebounceTimeoutRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [solicitudId, userId, token, esSolicitudReal]);

  const notificarEscribiendo = useCallback(() => {
    if (!socketRef.current || bloqueado) return;

    socketRef.current.emit('escribiendo', { solicitud_id: solicitudId });
    if (typingDebounceTimeoutRef.current) clearTimeout(typingDebounceTimeoutRef.current);
    typingDebounceTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('detener_escribiendo', { solicitud_id: solicitudId });
      }
    }, 2500);
  }, [solicitudId, bloqueado]);

  const notificarDetuvoEscribiendo = useCallback(() => {
    if (typingDebounceTimeoutRef.current) clearTimeout(typingDebounceTimeoutRef.current);
    if (socketRef.current?.connected) {
      socketRef.current.emit('detener_escribiendo', { solicitud_id: solicitudId });
    }
  }, [solicitudId]);

  const enviarMensaje = useCallback(
    (texto: string) => {
      if (!texto.trim() || bloqueado) return;

      const tempId = `temp-${Date.now()}`;
      const mensajeOptimista: MensajeChatModel = {
        id: tempId,
        solicitud_id: solicitudId,
        remitente_id: userId,
        contenido: texto.trim(),
        adjunto_url: null,
        enviado_en: new Date().toISOString(),
        leido: false,
        status: 'ENVIANDO',
      };

      setMensajes((prev) => [...prev, mensajeOptimista]);

      if (!socketRef.current) return;

      socketRef.current.emit(
        'enviar_mensaje',
        {
          solicitud_id: solicitudId,
          contenido: texto.trim(),
          temp_id: tempId,
        },
        (ack: any) => {
          if (ack?.error) {
            alert(ack.error);
            setMensajes((prev) => prev.filter((m) => m.id !== tempId));
          } else if (ack?.status === 'ENVIADO' || ack?.status === 'ok') {
            const realMsg = ack.mensaje || ack;
            const realId = realMsg?.id || ack.mensaje_id || tempId;
            setMensajes((prev) =>
              prev.map((m) =>
                m.id === tempId
                  ? {
                    ...m,
                    id: realId,
                    enviado_en: realMsg?.enviado_en || m.enviado_en,
                    status: 'ENVIADO',
                  }
                  : m
              )
            );
          }
        }
      );
    },
    [solicitudId, userId, bloqueado]
  );

  const subirArchivo = useCallback(
    async (file: File | Blob, customLabel?: string) => {
      if (!file || bloqueado) return;

      try {
        setSubiendoFoto(true);

        const isAudio =
          file.type?.startsWith('audio/') ||
          (file instanceof File && Boolean(file.name.match(/\.(webm|mp3|wav|m4a|ogg)$/i)));
        const fieldName = isAudio ? 'audio' : 'foto';
        const fileName = file instanceof File ? file.name : isAudio ? 'nota-audio.webm' : 'adjunto.jpg';

        const formData = new FormData();
        formData.append(fieldName, file, fileName);

        const res = await fetch(`${API_BASE_URL}/api/chat/${solicitudId}/adjunto`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'No se pudo subir el archivo adjunto');
        }

        const { adjunto_url } = data;
        if (adjunto_url) {
          const tempId = `temp-${Date.now()}`;
          const msgLabel = customLabel || (isAudio ? '🎤 Mensaje de voz' : '📷 Fotografía adjunta');
          const mensajeOptimista: MensajeChatModel = {
            id: tempId,
            solicitud_id: solicitudId,
            remitente_id: userId,
            contenido: msgLabel,
            adjunto_url,
            enviado_en: new Date().toISOString(),
            leido: false,
            status: 'ENVIANDO',
          };

          setMensajes((prev) => [...prev, mensajeOptimista]);

          if (socketRef.current?.connected) {
            socketRef.current.emit(
              'enviar_mensaje',
              {
                solicitud_id: solicitudId,
                contenido: msgLabel,
                adjunto_url,
                temp_id: tempId,
              },
              (ack: any) => {
                if (ack?.error) {
                  alert(ack.error);
                  setMensajes((prev) => prev.filter((m) => m.id !== tempId));
                } else if (ack?.status === 'ENVIADO' || ack?.status === 'ok') {
                  const realMsg = ack.mensaje || ack;
                  setMensajes((prev) =>
                    prev.map((m) =>
                      m.id === tempId
                        ? { ...m, id: realMsg.id, status: 'ENVIADO' }
                        : m
                    )
                  );
                }
              }
            );
          }
        }
      } catch (error: any) {
        console.error('Error al subir adjunto de chat:', error);
        alert(error.message || 'Error al adjuntar archivo al chat');
      } finally {
        setSubiendoFoto(false);
      }
    },
    [solicitudId, token, userId, bloqueado]
  );

  const responderPropuesta = useCallback(
    async (
      mensajeId: string,
      nuevoEstado: 'ACEPTADA' | 'REPROGRAMAR',
      respuestaTexto?: string
    ) => {
      if (!mensajeId || bloqueado) return;

      if (socketRef.current?.connected) {
        socketRef.current.emit('responder_propuesta', {
          solicitud_id: solicitudId,
          mensaje_id: mensajeId,
          nuevo_estado: nuevoEstado,
          respuesta_texto: respuestaTexto,
        });
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chat/${solicitudId}/propuesta/${mensajeId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              nuevo_estado: nuevoEstado,
              respuesta_texto: respuestaTexto,
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.mensaje_actualizado?.contenido) {
            setMensajes((prev) =>
              prev.map((m) =>
                m.id === mensajeId
                  ? { ...m, contenido: data.mensaje_actualizado.contenido }
                  : m
              )
            );
          }
        }
      } catch (err) {
        console.warn('Error en fallback REST de responderPropuesta:', err);
      }
    },
    [solicitudId, token, bloqueado]
  );

  return {
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
    recargarHistorial: cargarHistorial,
  };
};
