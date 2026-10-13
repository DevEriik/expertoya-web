export type UserRole = 'CLIENTE' | 'PROFESIONAL';

export type EscrowStatus = 'HELD' | 'RELEASED' | 'PENDING';

export type ChatStatus = 'EN PROGRESO' | 'ESCROW PENDIENTE' | 'COMPLETADO';

export interface Participant {
  id: string;
  name: string;
  profession: string;
  avatar: string;
  isVerified: boolean;
  role: UserRole;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  dateLabel?: string;
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
