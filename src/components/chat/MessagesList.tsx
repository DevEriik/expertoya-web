import React, { useState } from 'react';
import type { ChatSession, UserRole } from '../../types/chat';
import { ChatStatusBadge } from './ChatStatusBadge';
import { CheckCircle2, MessageSquare, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  activeRole: UserRole;
  isDark?: boolean;
}

export const MessagesList: React.FC<Props> = ({
  chats,
  activeChatId,
  onSelectChat,
  activeRole,
  isDark = false,
}) => {
  const navigate = useNavigate();
  const [dismissedPromptId, setDismissedPromptId] = useState<string | null>(null);

  const incomingChat =
    activeRole === 'PROFESIONAL' && chats.length > 0
      ? chats.find((c) => c.id !== dismissedPromptId)
      : null;

  return (
    <div className="w-full flex flex-col space-y-4">
      <div>
        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#FDFCF4]' : 'text-[#283593]'
            }`}
        >
          Mensajes
        </h1>
        <p
          className={`text-sm mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-[#64748B]'
            }`}
        >
          {activeRole === 'CLIENTE'
            ? 'Comunícate de forma segura con profesionales de confianza.'
            : 'Gestiona las consultas y solicitudes de tus clientes.'}
        </p>
      </div>

      {incomingChat && (
        <div
          className={`p-5 rounded-2xl border transition-all ${isDark
              ? 'bg-[#1E293B] border-[#FF8C00]/40 text-[#FDFCF4]'
              : 'bg-[#FFF7ED] border-[#FFB74D] text-[#334155]'
            }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#FF8C00]/20 flex items-center justify-center text-[#FF8C00]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span
              className={`font-bold text-sm uppercase tracking-wider ${isDark ? 'text-[#FFB74D]' : 'text-[#C2410C]'
                }`}
            >
              Nueva consulta recibida
            </span>
          </div>

          <p className="text-sm font-medium">
            <span className="font-bold">{incomingChat.client.name}</span> te ha
            enviado un mensaje:
          </p>

          <div
            className={`my-2.5 p-3 rounded-xl border text-sm italic ${isDark
                ? 'bg-[#121826] border-gray-700 text-gray-200'
                : 'bg-white border-orange-200 text-gray-700'
              }`}
          >
            "{incomingChat.lastMessage}"
          </div>

          <div className="flex items-center justify-between mt-3 pt-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              ¿Deseas responder ahora?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDismissedPromptId(incomingChat.id)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                Más tarde
              </button>
              <button
                type="button"
                onClick={() => onSelectChat(incomingChat.id)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#FF8C00] hover:bg-[#E67E00] shadow-sm transition-all cursor-pointer"
              >
                Responder
              </button>
            </div>
          </div>
        </div>
      )}

      {chats.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border ${isDark
              ? 'bg-[#1F2937]/50 border-gray-800'
              : 'bg-white border-gray-100 shadow-sm'
            }`}
        >
          <div className="w-16 h-16 rounded-full bg-[#FF8C00]/15 flex items-center justify-center text-[#FF8C00] mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>

          <h3
            className={`text-lg sm:text-xl font-bold ${isDark ? 'text-[#FDFCF4]' : 'text-[#283593]'
              }`}
          >
            No tienes conversaciones activas
          </h3>

          <p
            className={`text-sm max-w-md mt-1.5 ${isDark ? 'text-gray-400' : 'text-[#64748B]'
              }`}
          >
            {activeRole === 'CLIENTE'
              ? 'Busca un profesional de oficio en la plataforma y presiona "Contactar" para iniciar una conversación segura.'
              : 'Aún no has recibido consultas de clientes. Cuando un cliente te envíe un mensaje para coordinar un trabajo, aparecerá aquí.'}
          </p>

          {activeRole === 'CLIENTE' && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[#FF8C00] hover:bg-[#E67E00] shadow-md shadow-[#FF8C00]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buscar Profesionales</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Historial de mensajes">
          {chats.map((chat) => {
            const otherPerson =
              activeRole === 'CLIENTE' ? chat.professional : chat.client;
            const isSelected = activeChatId === chat.id;

            const avatarUri =
              otherPerson.avatar && otherPerson.avatar.trim() !== ''
                ? otherPerson.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  otherPerson.name || 'Usuario'
                )}&background=283593&color=fff`;

            return (
              <div
                key={chat.id}
                role="listitem"
                onClick={() => onSelectChat(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectChat(chat.id);
                  }
                }}
                tabIndex={0}
                aria-selected={isSelected}
                className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${isSelected
                    ? isDark
                      ? 'bg-[#1F2937] border-[#FFB74D] ring-2 ring-[#FFB74D]/30 shadow-lg'
                      : 'bg-white border-[#FF8C00] ring-2 ring-[#FF8C00]/20 shadow-md'
                    : isDark
                      ? 'bg-[#1F2937] border-gray-800 hover:border-gray-700 hover:bg-[#253245] shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={avatarUri}
                      alt={`Foto de perfil de ${otherPerson.name}`}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-black/5"
                    />
                    {chat.unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 bg-[#FF8C00] text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1F2937] shadow-sm animate-bounce"
                        aria-label={`${chat.unreadCount} mensajes no leídos`}
                      >
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-bold text-base sm:text-lg truncate ${isDark ? 'text-[#FDFCF4]' : 'text-[#283593]'
                          }`}
                      >
                        {otherPerson.name}
                      </span>
                      {otherPerson.isVerified && (
                        <CheckCircle2
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#10B981] shrink-0"
                          aria-label="Verificado"
                        />
                      )}
                    </div>
                    <p
                      className={`text-xs sm:text-sm font-normal truncate mt-0.5 max-w-[220px] sm:max-w-md ${isDark ? 'text-gray-300' : 'text-[#475569]'
                        }`}
                    >
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="mt-2 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                  <span
                    className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-[#64748B]'
                      }`}
                  >
                    {chat.timestamp}
                  </span>
                  <ChatStatusBadge status={chat.status} isDark={isDark} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
