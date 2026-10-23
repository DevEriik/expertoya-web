export interface Oficio {
  id: number;
  nombre_oficio: string;
  descripcion_oficio?: string;
}

export interface Professional {
  id: string;
  estado_validado: boolean;
  estado_auditoria: string;
  calificacion_promedio: number;
  ubicacion_geografica: string | null;
  latitud: number | null;
  longitud: number | null;
  descripcion_perfil: string | null;
  oficios: Oficio[];
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil: string | null;
  };
}

export type ProfessionalWithDistance = Professional & {
  distanciaKm: number | null;
};

export interface ProfessionalService {
  id: string;
  profesional_id?: string;
  oficio_id: number;
  nombre_oficio?: string;
  titulo_servicio: string;
  descripcion_servicio: string;
  costo_estimado: number;
  duracion_estimada: string;
  fotos_servicio: string[];
  servicio_activo: boolean;
}

export const PROFESSIONAL_SERVICES_STORAGE_KEY = "expertoya_user_services";
