import { useEffect, useState } from "react";
import { CheckCircle, XCircle, FileText, X } from "lucide-react";

interface ProfesionalPendiente {
  id: string;
  estado_validado: boolean;
  matricula_documento: string | null;
  usuario: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

export const AdminBackoffice = () => {
  const [pendientes, setPendientes] = useState<ProfesionalPendiente[]>([]);
  const [imagenModal, setImagenModal] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const cargarPendientes = async () => {
      try {
        const token = localStorage.getItem("token");

        const respuesta = await fetch(
          "http://localhost:3000/api/admin/pending-professionals",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          },
        );

        if (respuesta.ok) {
          const datos = await respuesta.json();
          setPendientes(datos);
        } else {
          console.error("Error en la respuesta del backend:", respuesta.status);
        }
      } catch (error) {
        console.error("Error al obtener profesionales:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarPendientes();
  }, []);

  const handleAprobar = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/admin/professionals/${id}/approve`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setPendientes((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error al aprobar:", error);
    }
  };

  const handleRechazar = async (id: string) => {
    const motivo = prompt("Motivo del rechazo:") || "Documentación no legible";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:3000/api/admin/professionals/${id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ motivo }),
        },
      );
      if (res.ok) {
        setPendientes((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error al rechazar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <section className="px-4 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark">
            Panel de Administración
          </h1>
          <p className="text-dark/60 mt-2">
            Auditoría de profesionales pendientes de validación
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {cargando ? (
            <p className="p-8 text-center text-gray-500 font-medium">
              Cargando profesionales...
            </p>
          ) : pendientes.length === 0 ? (
            <p className="p-8 text-center text-gray-500 font-medium">
              No hay profesionales pendientes de validación en este momento.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-dark/70 text-sm">
                  <th className="p-4 font-bold">Profesional</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold text-center">Documentación</th>
                  <th className="p-4 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((prof) => (
                  <tr
                    key={prof.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-dark flex items-center gap-2">
                      {prof.usuario.nombre} {prof.usuario.apellido}
                    </td>
                    <td className="p-4 text-sm text-dark/60 font-medium">
                      {prof.usuario.email}
                    </td>
                    <td className="p-4 text-center">
                      {prof.matricula_documento ? (
                        <button
                          onClick={() =>
                            setImagenModal(prof.matricula_documento)
                          }
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-bold"
                        >
                          <FileText size={16} /> Ver DNI/Matrícula
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Sin archivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleAprobar(prof.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-success/10 text-success hover:bg-success/20 rounded-lg text-sm font-bold transition-colors"
                      >
                        <CheckCircle size={16} /> Aprobar
                      </button>
                      <button
                        onClick={() => handleRechazar(prof.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-danger/10 text-danger hover:bg-danger/20 rounded-lg text-sm font-bold transition-colors"
                      >
                        <XCircle size={16} /> Rechazar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {imagenModal && (
          <div
            className="fixed inset-0 bg-dark/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setImagenModal(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-white rounded-2xl p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setImagenModal(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X size={32} />
              </button>
              <img
                src={imagenModal}
                alt="Documentación"
                className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
