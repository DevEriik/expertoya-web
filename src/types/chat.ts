export type UserRole = 'CLIENTE' | 'PROFESIONAL';

export type EscrowStatus = 'HELD' | 'RELEASED' | 'PENDING';

export type ChatStatus = 'EN PROGRESO' | 'ESCROW PENDIENTE' | 'COMPLETADO';

export type MessageDeliveryStatus = 'ENVIANDO' | 'ENVIADO' | 'ENTREGADO' | 'LEIDO';

export interface MensajeChatModel {
  id: string;
  solicitud_id: string;
  remitente_id: string;
  contenido: string;
  adjunto_url?: string | null;
  enviado_en: string | Date;
  leido: boolean;
  status?: MessageDeliveryStatus;
}

export interface Participant {
  id: string;
  name: string;
  profession: string;
  avatar: string | null;
  isVerified: boolean;
  role: UserRole;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  adjunto_url?: string | null;
  timestamp: string;
  dateLabel?: string;
  leido?: boolean;
  status?: MessageDeliveryStatus;
}

export interface ChatSession {
  id: string;
  client: Participant;
  professional: Participant;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  status: ChatStatus;
  escrowStatus: EscrowStatus;
  escrowAmount: string;
  messages: Message[];
}

export interface PropuestaVisitaData {
  id?: string;
  fecha: string;
  hora: string;
  presupuesto?: string;
  materiales?: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'REPROGRAMAR';
  nota?: string;
}

export const isPropuestaVisita = (text?: string | null): boolean => {
  return Boolean(text && text.startsWith('[PROPUESTA_VISITA]:'));
};

export const parsePropuestaVisita = (text?: string | null): PropuestaVisitaData | null => {
  if (!text || !text.startsWith('[PROPUESTA_VISITA]:')) return null;
  try {
    return JSON.parse(text.slice('[PROPUESTA_VISITA]:'.length));
  } catch {
    return null;
  }
};

export const formatPropuestaVisita = (data: PropuestaVisitaData): string => {
  return `[PROPUESTA_VISITA]:${JSON.stringify(data)}`;
};

export const isAudioAttachment = (url?: string | null, text?: string | null): boolean => {
  if (text && (text.includes('🎤') || text.toLowerCase().includes('mensaje de voz') || text.toLowerCase().includes('audio'))) {
    return true;
  }
  if (!url) return false;
  return Boolean(
    url.match(/\.(webm|mp3|wav|m4a|ogg|aac)($|\?)/i) ||
    url.startsWith('blob:') ||
    url.includes('/audio')
  );
};

export const buildGoogleCalendarUrl = (
  propuesta: PropuestaVisitaData,
  otherPersonName: string,
  profession?: string
): string => {
  let year: string;
  let month: string;
  let day: string;

  const isoMatch = propuesta.fecha?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const latamMatch = propuesta.fecha?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (isoMatch) {
    year = isoMatch[1];
    month = isoMatch[2];
    day = isoMatch[3];
  } else if (latamMatch) {
    day = latamMatch[1].padStart(2, '0');
    month = latamMatch[2].padStart(2, '0');
    year = latamMatch[3];
  } else {
    const d = new Date(propuesta.fecha || Date.now());
    if (!isNaN(d.getTime())) {
      year = String(d.getFullYear());
      month = String(d.getMonth() + 1).padStart(2, '0');
      day = String(d.getDate()).padStart(2, '0');
    } else {
      const today = new Date();
      year = String(today.getFullYear());
      month = String(today.getMonth() + 1).padStart(2, '0');
      day = String(today.getDate()).padStart(2, '0');
    }
  }

  const timeMatches = [...(propuesta.hora || '').matchAll(/(\d{1,2}):(\d{2})/g)];
  let startH = '10';
  let startM = '00';
  let endH = '12';
  let endM = '00';

  if (timeMatches.length >= 1) {
    startH = timeMatches[0][1].padStart(2, '0');
    startM = timeMatches[0][2].padStart(2, '0');
    if (timeMatches.length >= 2) {
      endH = timeMatches[1][1].padStart(2, '0');
      endM = timeMatches[1][2].padStart(2, '0');
    } else {
      endH = String((parseInt(startH, 10) + 2) % 24).padStart(2, '0');
      endM = startM;
    }
  }

  const dates = `${year}${month}${day}T${startH}${startM}00/${year}${month}${day}T${endH}${endM}00`;
  const title = `Visita Técnica - ExpertoYa (${otherPersonName})`;
  const details = `Visita Técnica coordinada a través de ExpertoYa.\n` +
    `Con: ${otherPersonName}${profession ? ` (${profession})` : ''}\n` +
    `Horario convenido: ${propuesta.hora}\n` +
    `Presupuesto estimado: ${propuesta.presupuesto || 'A convenir'}\n` +
    `Materiales / Insumos: ${propuesta.materiales || 'Herramientas estándar'}\n` +
    (propuesta.nota ? `Observaciones: ${propuesta.nota}\n` : '') +
    `Pago y coordinación protegidos con Escrow ExpertoYa.`;
  const location = 'Domicilio coordinado en ExpertoYa';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    location
  )}&dates=${dates}`;
};

