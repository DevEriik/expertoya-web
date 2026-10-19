import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { MessagesList } from "../components/chat/MessagesList";
import { ActiveConversation } from "../components/chat/ActiveConversation";
import { CLIENT_CHATS, PRO_CHATS } from "../data/mockChatData";
import type { ChatSession, UserRole } from "../types/chat";
import { useAuth } from "../context/AuthContext";

export const ChatsPage = () => {
  const { user } = useAuth();
  // Se evalúa automáticamente el rol según la autenticación del usuario
  const activeRole: UserRole =
    user?.rol === "PROFESIONAL" ? "PROFESIONAL" : "CLIENTE";

  const [chats, setChats] = useState<ChatSession[]>(() =>
    activeRole === "PROFESIONAL" ? PRO_CHATS : CLIENT_CHATS,
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Escuchar cambios de tema reactivamente
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    // Sincroniza los chats mock cuando cambia el rol autenticado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChats(activeRole === "PROFESIONAL" ? PRO_CHATS : CLIENT_CHATS);
  }, [activeRole]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const handleSendMessage = (chatId: string, text: string) => {
    const currentPersonId =
      activeRole === "CLIENTE" ? "user-client-1" : "pro-daniela";

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentPersonId,
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dateLabel: "Hoy",
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: text,
            timestamp: "Ahora",
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      }),
    );
  };

  const handleReleaseFunds = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            escrowStatus: "RELEASED",
            status: "COMPLETADO",
          };
        }
        return c;
      }),
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? "bg-[#121826] text-[#FDFCF4]" : "bg-[#FDFCF4] text-[#283593]"
      }`}
    >
      <Navbar />

      {/* Main Content Area (sin header repetido ni botones de selector de rol) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Mobile View: muestra listado o conversación activa */}
        <div className="block lg:hidden">
          {activeChat ? (
            <ActiveConversation
              chat={activeChat}
              activeRole={activeRole}
              isDark={isDark}
              onBack={() => setActiveChatId(null)}
              onSendMessage={handleSendMessage}
              onReleaseFunds={handleReleaseFunds}
            />
          ) : (
            <MessagesList
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={(id) => setActiveChatId(id)}
              activeRole={activeRole}
              isDark={isDark}
            />
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
          <div
            className={
              activeChat
                ? "lg:col-span-5"
                : "lg:col-span-12 max-w-4xl mx-auto w-full"
            }
          >
            <MessagesList
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={(id) => setActiveChatId(id)}
              activeRole={activeRole}
              isDark={isDark}
            />
          </div>

          {activeChat && (
            <div className="lg:col-span-7 sticky top-24">
              <ActiveConversation
                chat={activeChat}
                activeRole={activeRole}
                isDark={isDark}
                onBack={() => setActiveChatId(null)}
                onSendMessage={handleSendMessage}
                onReleaseFunds={handleReleaseFunds}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
