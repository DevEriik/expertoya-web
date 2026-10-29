import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { MessagesList } from "../components/chat/MessagesList";
import { ActiveConversation } from "../components/chat/ActiveConversation";
import type { ChatSession, UserRole } from "../types/chat";
import { useAuth } from "../context/AuthContext";

export const ChatsPage = () => {
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryChatId = searchParams.get("chatId");

  const activeRole: UserRole =
    user?.rol === "PROFESIONAL" ? "PROFESIONAL" : "CLIENTE";

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(queryChatId);

  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains("dark"),
  );

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

  const fetchConversaciones = useCallback(() => {
    if (!token) {
      setChats([]);
      return;
    }

    fetch("http://localhost:3000/api/chat/conversaciones", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.conversaciones) {
          setChats(data.conversaciones);
        } else {
          setChats([]);
        }
      })
      .catch((err) => {
        console.error("Error al cargar conversaciones en web:", err);
        setChats([]);
      });
  }, [token]);

  useEffect(() => {
    fetchConversaciones();
  }, [fetchConversaciones]);

  useEffect(() => {
    if (queryChatId) {
      setActiveChatId(queryChatId);
      fetchConversaciones();
    }
  }, [queryChatId, fetchConversaciones]);

  const activeChat =
    chats.find((c) => c.id === activeChatId) ||
    (activeChatId
      ? ({
        id: activeChatId,
        client: {
          id: user?.id || "",
          name:
            `${user?.nombre || ""} ${user?.apellido || ""}`.trim() || "Cliente",
          profession: "Cliente",
          avatar: null,
          isVerified: true,
          role: "CLIENTE",
        },
        professional: {
          id: "",
          name: "Profesional",
          profession: "Servicio",
          avatar: null,
          isVerified: true,
          role: "PROFESIONAL",
        },
        lastMessage: "",
        timestamp: "Ahora",
        unreadCount: 0,
        status: "EN PROGRESO",
        escrowStatus: "HELD",
        escrowAmount: "$0",
        messages: [],
      } as ChatSession)
      : null);

  const handleReleaseFunds = (targetChatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? { ...c, escrowStatus: "RELEASED", status: "COMPLETADO" }
          : c,
      ),
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? "bg-[#121826] text-[#FDFCF4]" : "bg-[#FDFCF4] text-[#283593]"
        }`}
    >
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="block lg:hidden">
          {activeChat ? (
            <ActiveConversation
              chat={activeChat}
              activeRole={activeRole}
              isDark={isDark}
              onBack={() => {
                setActiveChatId(null);
                setSearchParams({});
                fetchConversaciones();
              }}
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
                onReleaseFunds={handleReleaseFunds}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
