import React from 'react';
import type { ChatStatus } from '../../types/chat';
import { Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  status: ChatStatus;
  isDark?: boolean;
}

export const ChatStatusBadge: React.FC<Props> = ({ status, isDark }) => {
  switch (status) {
    case 'EN PROGRESO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] md:text-xs font-bold tracking-wide uppercase transition-colors ${
            isDark
              ? 'bg-amber-950/40 text-[#FBBF24] border border-amber-800/40'
              : 'bg-amber-50 text-[#D97706] border border-amber-200/60'
          }`}
          role="status"
          aria-label="Estado: En progreso"
        >
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" aria-hidden="true" />
          <Clock className="w-3 h-3 text-[#F59E0B]" aria-hidden="true" />
          <span>EN PROGRESO</span>
        </span>
      );

    case 'ESCROW PENDIENTE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] md:text-xs font-bold tracking-wide uppercase transition-colors ${
            isDark
              ? 'bg-teal-950/40 text-[#33EFA5] border border-teal-800/40'
              : 'bg-[#E6F8F5] text-[#00897B] border border-teal-200/60'
          }`}
          role="status"
          aria-label="Estado: Fideicomiso pendiente"
        >
          <span className="w-2 h-2 rounded-full bg-[#00BFA5]" aria-hidden="true" />
          <ShieldCheck className="w-3 h-3 text-[#00BFA5]" aria-hidden="true" />
          <span>ESCROW PENDIENTE</span>
        </span>
      );

    case 'COMPLETADO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] md:text-xs font-bold tracking-wide uppercase transition-colors ${
            isDark
              ? 'bg-emerald-950/40 text-[#34D399] border border-emerald-800/40'
              : 'bg-emerald-50 text-[#059669] border border-emerald-200/60'
          }`}
          role="status"
          aria-label="Estado: Completado"
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981]" aria-hidden="true" />
          <CheckCircle2 className="w-3 h-3 text-[#10B981]" aria-hidden="true" />
          <span>COMPLETADO</span>
        </span>
      );

    default:
      return null;
  }
};
