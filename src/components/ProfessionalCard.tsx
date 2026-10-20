import { BadgeCheck, Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProfessionalWithDistance } from "../types/professional";

interface Props {
  profesional: ProfessionalWithDistance;
}

export const ProfessionalCard = ({ profesional: pro }: Props) => {
  const navigate = useNavigate();

  const nombre = `${pro.usuario.nombre} ${pro.usuario.apellido}`;
  const oficio = pro.oficios?.[0]?.nombre_oficio ?? "Profesional";
  const rating = Number(pro.calificacion_promedio) || 0;
  const irAlPerfil = () => navigate(`/profesionales/${pro.id}`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={irAlPerfil}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          irAlPerfil();
        }
      }}
      className="relative cursor-pointer bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start gap-4 mb-4">
        {pro.usuario.foto_perfil ? (
          <img
            src={pro.usuario.foto_perfil}
            alt={nombre}
            className="w-14 h-14 rounded-full object-cover border border-gray-100 dark:border-gray-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-gray-100 dark:border-gray-700">
            {pro.usuario.nombre?.[0] ?? "?"}
            {pro.usuario.apellido?.[0] ?? ""}
          </div>
        )}

        <div>
          <h3 className="font-bold text-dark dark:text-white flex items-center gap-1">
            {nombre}
            {pro.estado_validado && (
              <BadgeCheck
                size={18}
                className="text-success dark:text-success-dark"
              />
            )}
          </h3>
          <p className="text-sm text-dark/60 dark:text-gray-400 font-medium">
            {oficio}
          </p>

          {rating > 0 ? (
            <div className="flex items-center gap-1 mt-1 text-sm font-bold">
              <Star
                size={14}
                className="text-warning fill-warning dark:text-warning-dark dark:fill-warning-dark"
              />
              <span className="text-dark dark:text-gray-200">
                {rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="inline-block mt-1 text-xs font-semibold text-secondary">
              Nuevo
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-dark/60 dark:text-gray-400 text-sm font-medium mb-6 mt-auto">
        <MapPin size={16} />
        <span>
          {pro.ubicacion_geografica ?? "Ubicación no disponible"}
          {pro.distanciaKm != null && (
            <span className="text-secondary font-bold">
              {" "}
              · a {pro.distanciaKm.toFixed(1).replace(".", ",")} km
            </span>
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
      >
        Contratar
      </button>
    </div>
  );
};
