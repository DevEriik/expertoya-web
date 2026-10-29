import React, { useState } from 'react';
import { X, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ContactModalProps {
  isOpen: boolean;
  professionalId: string;
  professionalName: string;
  professionalPhoto?: string | null;
  profession?: string;
  onClose: () => void;
  onSuccess: (solicitudId: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  professionalId,
  professionalName,
  professionalPhoto,
  profession,
  onClose,
  onSuccess,
}) => {
  const { user, token } = useAuth();
  const [primerMensaje, setPrimerMensaje] = useState(
    '¡Hola! Me gustaría consultar por la disponibilidad de tu servicio.'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Debes iniciar sesión para contactar a un profesional.');
      return;
    }

    if (user.id === professionalId) {
      alert('Acción no permitida: No puedes enviarte mensajes a ti mismo.');
      onClose();
      return;
    }

    if (!primerMensaje.trim()) {
      alert('Por favor ingresa un mensaje para iniciar la conversación.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/chat/iniciar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profesional_id: professionalId,
          primer_mensaje: primerMensaje.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar la conversación');
      }

      onClose();
      onSuccess(data.solicitud_id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Ocurrió un error al contactar al profesional.';
      console.error('Error al iniciar conversación:', msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const avatarUri =
    professionalPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      professionalName
    )}&background=FF8C00&color=fff`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-3">
            <img
              src={avatarUri}
              alt={professionalName}
              className="w-18 h-18 rounded-full object-cover ring-4 ring-[#FF8C00]/20"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#10B981] text-white p-1 rounded-full ring-2 ring-white dark:ring-[#1E293B]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#283593] dark:text-[#FDFCF4]">
            ¿Deseas contactarte con {professionalName}?
          </h2>
          {profession && (
            <span className="text-sm font-semibold text-[#FF8C00] mt-0.5">
              {profession}
            </span>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-300 mt-2 max-w-sm">
            Envía un mensaje para coordinar los detalles del servicio de forma directa y segura.
          </p>
        </div>

        <form onSubmit={handleStartChat} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Mensaje inicial
            </label>
            <textarea
              value={primerMensaje}
              onChange={(e) => setPrimerMensaje(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={3}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#121826] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent transition-all resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#FF8C00] hover:bg-[#E67E00] shadow-md shadow-[#FF8C00]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Comenzar charla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
