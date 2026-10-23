import type { ProfessionalService } from "../types/professional";

const STORAGE_KEY = "expertoya_user_services";
export const MAX_ACTIVE_SERVICES = 30;

export const DEFAULT_SERVICES: ProfessionalService[] = [
  {
    id: "1",
    oficio_id: 3,
    nombre_oficio: "Electricista",
    titulo_servicio: "Reparación de Tablero Eléctrico",
    descripcion_servicio:
      "Diagnóstico preventivo y correctivo, cambio de llaves térmicas y disyuntor diferencial bajo normativa IRAM. Incluye revisión de puesta a tierra y medición de cargas para evitar sobrecalentamientos.",
    costo_estimado: 45000,
    duracion_estimada: "2-3 horas",
    fotos_servicio: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop",
    ],
    servicio_activo: true,
  },
  {
    id: "2",
    oficio_id: 3,
    nombre_oficio: "Electricista",
    titulo_servicio: "Instalación de Tomacorrientes y Llaves de Luz",
    descripcion_servicio:
      "Instalación de bocas nuevas, llaves combinadas y tomas de alto consumo para aires acondicionados con materiales ignífugos normados.",
    costo_estimado: 15000,
    duracion_estimada: "1 hora",
    fotos_servicio: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&auto=format&fit=crop",
    ],
    servicio_activo: true,
  },
];

let inMemoryServices: ProfessionalService[] | null = null;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getAuthHeaders = (): HeadersInit => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const getServices = async (): Promise<ProfessionalService[]> => {
  // 1. Intentar obtener desde el backend si hay token
  try {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      const res = await fetch(`${API_BASE}/api/professionals/services`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          inMemoryServices = data;
          await persistServices(data);
          return [...data];
        }
      }
    }
  } catch (err) {
    console.warn("Backend no disponible para servicios, usando almacenamiento local:", err);
  }

  // 2. Fallback a localStorage / memoria
  if (inMemoryServices) {
    return [...inMemoryServices];
  }

  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryServices = parsed;
        return [...inMemoryServices];
      }
    }
  } catch (err) {
    console.warn("Error leyendo servicios del almacenamiento local:", err);
  }

  inMemoryServices = [...DEFAULT_SERVICES];
  await persistServices(inMemoryServices);
  return [...inMemoryServices];
};

export const saveService = async (
  serviceData: Omit<ProfessionalService, "id"> & { id?: string }
): Promise<ProfessionalService> => {
  const isEditing = Boolean(serviceData.id);

  // 1. Validar límite de activos
  if (serviceData.servicio_activo) {
    const current = await getServices();
    const activeCount = current.filter(
      (s) => s.servicio_activo && (!isEditing || s.id !== serviceData.id)
    ).length;
    if (activeCount >= MAX_ACTIVE_SERVICES) {
      throw new Error(
        `Límite alcanzado: Tienes ${MAX_ACTIVE_SERVICES} servicios activos. Pausa o elimina uno para activar este servicio.`
      );
    }
  }

  // 2. Intentar guardar en backend
  try {
    const endpoint = isEditing
      ? `${API_BASE}/api/professionals/services/${serviceData.id}`
      : `${API_BASE}/api/professionals/services`;
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData),
    });

    if (res.ok) {
      const json = await res.json();
      const saved = json.servicio || json.data || json;
      if (saved && saved.id) {
        await syncLocalAfterSave(saved, isEditing);
        emitServicesChanged();
        return saved;
      }
    }
  } catch (err) {
    console.warn("No se pudo guardar en backend, guardando localmente:", err);
  }

  // 3. Fallback a persistencia local
  const current = inMemoryServices || (await getServices());
  let savedItem: ProfessionalService;
  let updatedList: ProfessionalService[];

  if (isEditing) {
    savedItem = { ...serviceData, id: serviceData.id! } as ProfessionalService;
    updatedList = current.map((s) => (s.id === serviceData.id ? savedItem : s));
  } else {
    savedItem = {
      ...serviceData,
      id: Date.now().toString(),
    } as ProfessionalService;
    updatedList = [savedItem, ...current];
  }

  inMemoryServices = updatedList;
  await persistServices(updatedList);
  emitServicesChanged();
  return savedItem;
};

const syncLocalAfterSave = async (item: ProfessionalService, isEditing: boolean) => {
  const current = inMemoryServices || (await getServices());
  let updated: ProfessionalService[];
  if (isEditing) {
    updated = current.map((s) => (s.id === item.id ? item : s));
  } else {
    updated = [item, ...current];
  }
  inMemoryServices = updated;
  await persistServices(updated);
};

export const toggleServiceStatus = async (id: string): Promise<ProfessionalService> => {
  const current = await getServices();
  const existing = current.find((s) => s.id === id);
  if (!existing) {
    throw new Error("Servicio no encontrado.");
  }

  const newStatus = !existing.servicio_activo;

  if (newStatus) {
    const activeCount = current.filter((s) => s.servicio_activo && s.id !== id).length;
    if (activeCount >= MAX_ACTIVE_SERVICES) {
      throw new Error(
        `Límite alcanzado: Ya cuentas con el máximo de ${MAX_ACTIVE_SERVICES} servicios activos. Pausa otro servicio primero.`
      );
    }
  }

  try {
    await fetch(`${API_BASE}/api/professionals/services/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ servicio_activo: newStatus }),
    });
  } catch {
    // fallback
  }

  const updatedItem: ProfessionalService = {
    ...existing,
    servicio_activo: newStatus,
  };
  const updatedList = current.map((s) => (s.id === id ? updatedItem : s));
  inMemoryServices = updatedList;
  await persistServices(updatedList);
  emitServicesChanged();
  return updatedItem;
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_BASE}/api/professionals/services/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch {
    // fallback
  }

  const current = await getServices();
  const updatedList = current.filter((s) => s.id !== id);
  inMemoryServices = updatedList;
  await persistServices(updatedList);
  emitServicesChanged();
};

const persistServices = async (list: ProfessionalService[]) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.error("Error al persistir servicios en localStorage:", err);
  }
};

const emitServicesChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("servicesChanged"));
  }
};
