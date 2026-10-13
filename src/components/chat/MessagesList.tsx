import React from 'react';
import type { ChatSession, UserRole } from '../../types/chat';
import { ChatStatusBadge } from './ChatStatusBadge';
import { CheckCircle2 } from 'lucide-react';

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
  return (
    <div className="w-full flex flex-col">
      {/* Cards List */}
      <div className="space-y-3.5" role="list" aria-label="Historial de mensajes">
        {chats.map((chat) => {
          // Si el usuario es CLIENTE ve al profesional; si es PROFESIONAL ve al cliente.
          const otherPerson =
            activeRole === 'CLIENTE' ? chat.professional : chat.client;
          const isSelected = activeChatId === chat.id;

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
              className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? isDark
                    ? 'bg-[#1F2937] border-[#FFB74D] ring-2 ring-[#FFB74D]/30 shadow-lg'
                    : 'bg-white border-[#FF8C00] ring-2 ring-[#FF8C00]/20 shadow-md'
                  : isDark
                  ? 'bg-[#1F2937] border-gray-800 hover:border-gray-700 hover:bg-[#253245] shadow-sm'
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md shadow-sm'
              }`}
            >
              {/* Left Column: Avatar + Info */}
              <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto min-w-0">
                {/* Avatar with unread badge */}
                <div className="relative shrink-0">
                  <img
                    src={otherPerson.avatar}
                    alt={`Foto de perfil de ${otherPerson.name}`}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-black/5"
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

                {/* Name, check, preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-bold text-base sm:text-lg truncate ${
                        isDark ? 'text-[#FDFCF4]' : 'text-[#283593]'
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
                    className={`text-xs sm:text-sm font-normal truncate mt-0.5 max-w-[220px] sm:max-w-md ${
                      isDark ? 'text-gray-300' : 'text-[#475569]'
                    }`}
                  >
                    {chat.lastMessage}
                  </p>
                </div>
              </div>

              {/* Right Column: Timestamp & Status badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 gap-2 shrink-0">
                <span
                  className={`text-xs font-medium ${
                    isDark ? 'text-gray-400' : 'text-[#94A3B8]'
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
    </div>
  );
};
