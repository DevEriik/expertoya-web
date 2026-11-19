export interface OficioItem {
  id: number;
  nombre: string;
  nombre_oficio?: string;
  descripcion_oficio?: string;
  requiresLicense: boolean;
  licenseAuthority?: string;
}

export const OFICIOS_CATALOGO: OficioItem[] = [
  { id: 1, nombre: "Plomero", requiresLicense: false },
  {
    id: 2,
    nombre: "Gasista Matriculado",
    requiresLicense: true,
    licenseAuthority: "Carnet habilitante de Camuzzi Gas del Sur",
  },
  {
    id: 3,
    nombre: "Electricista",
    requiresLicense: true,
    licenseAuthority: "Matrícula habilitante EPEN / CALF",
  },
  { id: 4, nombre: "Pintor", requiresLicense: false },
  { id: 5, nombre: "Cerrajero", requiresLicense: false },
  { id: 6, nombre: "Refrigeración", requiresLicense: false },
  { id: 7, nombre: "Albañilería", requiresLicense: false },
  { id: 8, nombre: "Carpintero", requiresLicense: false },
];

export const ZONAS_SUGERIDAS = [
  "Neuquén",
  "Cipolletti",
  "Plottier",
  "Fernandez Oro",
  "Allen",
  "Cutral Co",
  "Zapala",
  "General Roca",
  "Centenario",
  "Villa Regina",
];

export interface DiaSemanaItem {
  dia_semana: number;
  nombre: string;
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
}

export const DIAS_SEMANA_DEFAULT: DiaSemanaItem[] = [
  { dia_semana: 1, nombre: "Lunes", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 2, nombre: "Martes", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 3, nombre: "Miércoles", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 4, nombre: "Jueves", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 5, nombre: "Viernes", activo: false, hora_inicio: "08:00", hora_fin: "17:00" },
  { dia_semana: 6, nombre: "Sábado", activo: false, hora_inicio: "09:00", hora_fin: "13:00" },
  { dia_semana: 7, nombre: "Domingo", activo: false, hora_inicio: "09:00", hora_fin: "13:00" },
];

export const isLicenseRequired = (oficio?: OficioItem | null): boolean => {
  if (!oficio) return false;
  if (oficio.requiresLicense) return true;
  if (oficio.id === 2 || oficio.id === 3) return true;
  const name = (oficio.nombre_oficio || oficio.nombre || "").toLowerCase();
  return (
    name.includes("gasista") ||
    name.includes("electricista") ||
    name.includes("matriculad")
  );
};

export const mapBackendOficiosToIds = (
  rawOficios: unknown,
  catalog: OficioItem[]
): number[] => {
  if (!rawOficios) return [];
  const list = Array.isArray(rawOficios) ? rawOficios : [rawOficios];
  const ids: number[] = [];

  for (const item of list) {
    if (typeof item === "number") {
      ids.push(item);
    } else if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      if (typeof obj.id === "number") {
        ids.push(obj.id);
      } else if (obj.nombre_oficio || obj.nombre) {
        const nameToMatch = String(obj.nombre_oficio || obj.nombre || "")
          .toLowerCase()
          .trim();
        const found = catalog.find(
          (c) =>
            c.nombre.toLowerCase().trim() === nameToMatch ||
            (c.nombre_oficio &&
              c.nombre_oficio.toLowerCase().trim() === nameToMatch) ||
            nameToMatch.includes(c.nombre.toLowerCase().trim()) ||
            c.nombre.toLowerCase().trim().includes(nameToMatch)
        );
        if (found) ids.push(found.id);
      }
    } else if (typeof item === "string") {
      const trimmed = item.trim();
      const num = Number(trimmed);
      if (!isNaN(num) && num > 0) {
        ids.push(num);
      } else {
        const str = trimmed.toLowerCase();
        const found = catalog.find(
          (c) =>
            c.nombre.toLowerCase().includes(str) ||
            str.includes(c.nombre.toLowerCase()) ||
            (str === "plumber" && c.id === 1) ||
            (str === "gas_fitter" && c.id === 2) ||
            (str === "electrician" && c.id === 3) ||
            (str === "painter" && c.id === 4)
        );
        if (found) ids.push(found.id);
      }
    }
  }

  return Array.from(new Set(ids));
};
