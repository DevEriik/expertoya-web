import React, { useState, useRef, useEffect } from 'react';
import type { ChatSession, UserRole, Message } from '../../types/chat';
import {
  ArrowLeft,
  Video,
  ShieldCheck,
  Camera,
  Mic,
  Send,
  CheckCheck,
} from 'lucide-react';

interface Props {
  chat: ChatSession;
  activeRole: UserRole;
  isDark?: boolean;
  onBack?: () => void;
  onSendMessage: (chatId: string, text: string) => void;
  onReleaseFunds: (chatId: string) => void;
}

export const ActiveConversation: React.FC<Props> = ({
  chat,
  activeRole,
  isDark = false,
  onBack,
  onSendMessage,
  onReleaseFunds,
}) => {
  const [inputText, setInputText] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherPerson =
    activeRole === 'CLIENTE' ? chat.professional : chat.client;
  const currentPerson =
    activeRole === 'CLIENTE' ? chat.client : chat.professional;

  // Auto-scroll hacia el final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(chat.id, inputText.trim());
    setInputText('');
  };

  return (
    <div
      className={`flex flex-col h-[750px] max-h-[85vh] w-full rounded-2xl sm:rounded-3xl border overflow-hidden shadow-lg transition-colors ${
        isDark
          ? 'bg-[#121826] border-gray-800'
          : 'bg-[#FDFCF4] border-gray-200/80'
      }`}
    >
      {/* 1. Header */}
      <header
        className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0 ${
          isDark
            ? 'bg-[#1F2937] border-gray-800 text-[#FDFCF4]'
            : 'bg-white border-gray-100 text-[#283593]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1 text-[#283593] dark:text-[#FDFCF4] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Volver al historial de chats"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <div className="relative shrink-0">
            <img
              src={otherPerson.avatar}
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
              className={`font-bold text-base sm:text-lg leading-tight truncate ${
                isDark ? 'text-[#FDFCF4]' : 'text-[#283593]'
              }`}
            >
              {otherPerson.name}
            </h2>
            <p
              className={`text-xs font-medium truncate ${
                isDark ? 'text-gray-400' : 'text-[#64748B]'
              }`}
            >
              {otherPerson.profession}
            </p>
          </div>
        </div>

        {/* Botón de Videollamada */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCalling(!isCalling)}
            className="p-2 sm:p-2.5 rounded-xl text-[#00BFA5] hover:bg-[#00BFA5]/10 active:scale-95 transition-all"
            aria-label="Iniciar videollamada"
            title="Iniciar videollamada segura"
          >
            <Video className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Notificación de llamada */}
      {isCalling && (
        <div className="bg-[#00BFA5] text-white px-4 py-2 text-xs flex items-center justify-between font-semibold animate-pulse">
          <span>Conectando videollamada cifrada de extremo a extremo...</span>
          <button
            onClick={() => setIsCalling(false)}
            className="underline hover:opacity-80"
          >
            Finalizar
          </button>
        </div>
      )}

      {/* 2. Banner de Fideicomiso / Escrow */}
      <section
        aria-label="Garantía de Fondos en Custodia"
        className={`px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b shrink-0 transition-colors ${
          chat.escrowStatus === 'RELEASED'
            ? isDark
              ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
              : 'bg-emerald-50/80 border-emerald-100 text-emerald-700'
            : isDark
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : 'bg-[#E8F8F5] border-[#D1F2EB] text-[#00897B]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            className={`w-5 h-5 shrink-0 ${
              chat.escrowStatus === 'RELEASED'
                ? 'text-[#10B981]'
                : isDark
                ? 'text-[#34D399]'
                : 'text-[#00BFA5]'
            }`}
          />
          <div className="text-xs sm:text-sm font-semibold">
            {chat.escrowStatus === 'RELEASED' ? (
              <span>Fondos liberados con éxito ({chat.escrowAmount}).</span>
            ) : (
              <span>Fondos en custodia garantizada ({chat.escrowAmount}).</span>
            )}
          </div>
        </div>

        {/* Acción de Liberación */}
        {activeRole === 'CLIENTE' && chat.escrowStatus !== 'RELEASED' ? (
          <button
            onClick={() => onReleaseFunds(chat.id)}
            className="w-full sm:w-auto px-4 py-2 bg-[#00BFA5] hover:bg-[#009e89] active:bg-[#00897B] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm shadow-[#00BFA5]/25 focus:ring-2 focus:ring-[#00BFA5] focus:outline-none"
            aria-label="Liberar fondos en custodia al profesional"
          >
            Liberar Fondos
          </button>
        ) : activeRole === 'CLIENTE' && chat.escrowStatus === 'RELEASED' ? (
          <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> Pagado
          </span>
        ) : (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {chat.escrowStatus === 'RELEASED'
              ? 'Fondos acreditados a tu cuenta'
              : 'En custodia hasta confirmación del cliente'}
          </span>
        )}
      </section>

      {/* 3. Stream de Mensajes */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Historial de mensajes de la conversación"
      >
        {/* Separador de Fecha */}
        <div className="flex justify-center my-2">
          <span
            className={`text-[11px] font-medium px-3.5 py-1 rounded-full uppercase tracking-wider ${
              isDark
                ? 'bg-gray-800 text-gray-400'
                : 'bg-white text-gray-500 border border-gray-100 shadow-2xs'
            }`}
          >
            Hoy
          </span>
        </div>

        {/* Burbujas */}
        {chat.messages.map((msg: Message) => {
          const isCurrentUser = msg.senderId === currentPerson.id;

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%] ${
                isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'
              }`}
            >
              {!isCurrentUser && (
                <img
                  src={otherPerson.avatar}
                  alt=""
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-1"
                />
              )}

              <div
                className={`flex flex-col ${
                  isCurrentUser ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isCurrentUser
                      ? 'bg-[#FF8C00] text-white rounded-br-xs shadow-md font-medium'
                      : isDark
                      ? 'bg-[#1F2937] text-[#FDFCF4] border border-gray-700/80 rounded-bl-xs shadow-sm'
                      : 'bg-white text-[#283593] border border-gray-100 rounded-bl-xs shadow-sm font-medium'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span
                  className={`text-[10px] mt-1 px-1 font-medium ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Barra Inferior de Entrada */}
      <footer
        className={`p-3 sm:p-4 border-t shrink-0 ${
          isDark
            ? 'bg-[#1F2937] border-gray-800'
            : 'bg-white border-gray-100'
        }`}
      >
        <form onSubmit={handleSend} className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className={`p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isDark ? 'text-gray-400' : 'text-[#64748B]'
            }`}
            aria-label="Adjuntar foto de la cámara"
            title="Adjuntar foto"
            onClick={() => {
              alert('Cámara / Galería: Puedes adjuntar imágenes del trabajo realizado.');
            }}
          >
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe un mensaje..."
              className={`w-full py-2.5 sm:py-3 px-4 rounded-full text-xs sm:text-sm font-normal outline-none transition-all ${
                isDark
                  ? 'bg-[#121826] text-[#FDFCF4] placeholder-gray-500 border border-gray-700 focus:border-[#FFB74D] focus:ring-1 focus:ring-[#FFB74D]'
                  : 'bg-[#F8FAFC] text-[#283593] placeholder-gray-400 border border-gray-200 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00]'
              }`}
            />
          </div>

          <button
            type="submit"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FF8C00] hover:bg-[#e67e00] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF8C00]/30 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF8C00]"
            aria-label={inputText.trim() ? 'Enviar mensaje' : 'Grabar mensaje de voz'}
          >
            {inputText.trim() ? (
              <Send className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5" />
            ) : (
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};
