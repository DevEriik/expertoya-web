import type { ChatSession, Participant } from "../types/chat";
import danielaImg from "../assets/chat/daniela.jpg";
import carlosImg from "../assets/chat/carlos.jpg";
import luciaImg from "../assets/chat/lucia.jpg";
import martinImg from "../assets/chat/martin.jpg";

export const CURRENT_CLIENT: Participant = {
  id: "user-client-1",
  name: "Carlos Mendoza",
  profession: "Cliente (Propietario)",
  avatar: carlosImg,
  isVerified: true,
  role: "CLIENTE",
};

export const CURRENT_PRO: Participant = {
  id: "pro-daniela",
  name: "Daniela Oñatibia",
  profession: "Electricista Matriculada",
  avatar: danielaImg,
  isVerified: true,
  role: "PROFESIONAL",
};

// Chats cuando el usuario logueado es CLIENTE (interactúa con profesionales)
export const CLIENT_CHATS: ChatSession[] = [
  {
    id: "chat-1",
    client: CURRENT_CLIENT,
    professional: {
      id: "pro-daniela",
      name: "Daniela Oñatibia",
      profession: "Electricista Matriculada",
      avatar: danielaImg,
      isVerified: true,
      role: "PROFESIONAL",
    },
    lastMessage: "Estaré allí en 15 minutos con los materiales.",
    timestamp: "10:42 AM",
    unreadCount: 2,
    status: "EN PROGRESO",
    escrowStatus: "HELD",
    escrowAmount: "$15.000",
    messages: [
      {
        id: "msg-1-1",
        senderId: "pro-daniela",
        text: "¡Hola! Vi tu solicitud. Puedo solucionar ese cortocircuito hoy mismo.",
        timestamp: "10:30 AM",
        dateLabel: "Hoy",
      },
      {
        id: "msg-1-2",
        senderId: "user-client-1",
        text: "Genial. Los fondos ya están en garantía. ¿Cuándo podrías venir?",
        timestamp: "10:35 AM",
        dateLabel: "Hoy",
      },
      {
        id: "msg-1-3",
        senderId: "pro-daniela",
        text: "Estaré allí en 15 minutos con los materiales.",
        timestamp: "10:42 AM",
        dateLabel: "Hoy",
      },
    ],
  },
  {
    id: "chat-2",
    client: CURRENT_CLIENT,
    professional: {
      id: "pro-juan",
      name: "Juan Pérez",
      profession: "Plomero Matriculado",
      avatar: martinImg,
      isVerified: true,
      role: "PROFESIONAL",
    },
    lastMessage: "¿Podrías enviarme una foto de la cañería?",
    timestamp: "Ayer",
    unreadCount: 0,
    status: "ESCROW PENDIENTE",
    escrowStatus: "PENDING",
    escrowAmount: "$8.500",
    messages: [
      {
        id: "msg-2-1",
        senderId: "user-client-1",
        text: "Hola Juan, tengo una pérdida debajo de la bacha de la cocina.",
        timestamp: "Ayer 15:15",
        dateLabel: "Ayer",
      },
      {
        id: "msg-2-2",
        senderId: "pro-juan",
        text: "¿Podrías enviarme una foto de la cañería?",
        timestamp: "Ayer 15:20",
        dateLabel: "Ayer",
      },
    ],
  },
  {
    id: "chat-3",
    client: CURRENT_CLIENT,
    professional: {
      id: "pro-maria",
      name: "María Silva",
      profession: "Técnica en Refrigeración",
      avatar: luciaImg,
      isVerified: true,
      role: "PROFESIONAL",
    },
    lastMessage: "¡Muchas gracias! El pago del trabajo ha sido liberado.",
    timestamp: "Lun",
    unreadCount: 0,
    status: "COMPLETADO",
    escrowStatus: "RELEASED",
    escrowAmount: "$22.000",
    messages: [
      {
        id: "msg-3-1",
        senderId: "pro-maria",
        text: "El mantenimiento del aire acondicionado quedó finalizado y probado.",
        timestamp: "Lun 11:10",
        dateLabel: "Lunes",
      },
      {
        id: "msg-3-2",
        senderId: "user-client-1",
        text: "¡Funciona de diez! Ya confirmo la liberación del fideicomiso.",
        timestamp: "Lun 11:25",
        dateLabel: "Lunes",
      },
      {
        id: "msg-3-3",
        senderId: "pro-maria",
        text: "¡Muchas gracias! El pago del trabajo ha sido liberado.",
        timestamp: "Lun 11:26",
        dateLabel: "Lunes",
      },
    ],
  },
];

// Chats cuando el usuario logueado es PROFESIONAL (interactúa con clientes)
export const PRO_CHATS: ChatSession[] = [
  {
    id: "pro-chat-1",
    client: CURRENT_CLIENT,
    professional: {
      id: "pro-daniela",
      name: "Daniela Oñatibia",
      profession: "Electricista Matriculada",
      avatar: danielaImg,
      isVerified: true,
      role: "PROFESIONAL",
    },
    lastMessage: "Estaré allí en 15 minutos con los materiales.",
    timestamp: "10:42 AM",
    unreadCount: 0,
    status: "EN PROGRESO",
    escrowStatus: "HELD",
    escrowAmount: "$15.000",
    messages: [
      {
        id: "pmsg-1-1",
        senderId: "pro-daniela",
        text: "¡Hola! Vi tu solicitud. Puedo solucionar ese cortocircuito hoy mismo.",
        timestamp: "10:30 AM",
        dateLabel: "Hoy",
      },
      {
        id: "pmsg-1-2",
        senderId: "user-client-1",
        text: "Genial. Los fondos ya están en garantía. ¿Cuándo podrías venir?",
        timestamp: "10:35 AM",
        dateLabel: "Hoy",
      },
      {
        id: "pmsg-1-3",
        senderId: "pro-daniela",
        text: "Estaré allí en 15 minutos con los materiales.",
        timestamp: "10:42 AM",
        dateLabel: "Hoy",
      },
    ],
  },
  {
    id: "pro-chat-2",
    client: {
      id: "client-lucia",
      name: "Lucía Gómez",
      profession: "Cliente (Propietaria)",
      avatar: luciaImg,
      isVerified: true,
      role: "CLIENTE",
    },
    professional: {
      id: "pro-daniela",
      name: "Daniela Oñatibia",
      profession: "Electricista Matriculada",
      avatar: danielaImg,
      isVerified: true,
      role: "PROFESIONAL",
    },
    lastMessage:
      "Hola Daniela, ¿podrías pasarme un presupuesto para el recambio de térmicas?",
    timestamp: "Ayer",
    unreadCount: 1,
    status: "ESCROW PENDIENTE",
    escrowStatus: "PENDING",
    escrowAmount: "$12.000",
    messages: [
      {
        id: "pmsg-2-1",
        senderId: "client-lucia",
        text: "Hola Daniela, ¿podrías pasarme un presupuesto para el recambio de térmicas?",
        timestamp: "Ayer 18:20",
        dateLabel: "Ayer",
      },
    ],
  },
  {
    id: "pro-chat-3",
    client: {
      id: "client-martin",
      name: "Martín Rossi",
      profession: "Cliente (Comercio)",
      avatar: martinImg,
      isVerified: true,
      role: "CLIENTE",
    },
    professional: {
      id: "pro-daniela",
      name: "Daniela Oñatibia",
      profession: "Electricista Matriculada",
      avatar: danielaImg,
      isVerified: true,
      role: "PROFESIONAL",
    },
    lastMessage:
      "Excelente trabajo en el tablero trifásico. Ya liberé los fondos.",
    timestamp: "Lun",
    unreadCount: 0,
    status: "COMPLETADO",
    escrowStatus: "RELEASED",
    escrowAmount: "$35.000",
    messages: [
      {
        id: "pmsg-3-1",
        senderId: "pro-daniela",
        text: "Martín, la instalación del tablero trifásico quedó completada y testeada.",
        timestamp: "Lun 16:00",
        dateLabel: "Lunes",
      },
      {
        id: "pmsg-3-2",
        senderId: "client-martin",
        text: "Excelente trabajo en el tablero trifásico. Ya liberé los fondos.",
        timestamp: "Lun 16:15",
        dateLabel: "Lunes",
      },
    ],
  },
];

export const INITIAL_CHATS = CLIENT_CHATS;
