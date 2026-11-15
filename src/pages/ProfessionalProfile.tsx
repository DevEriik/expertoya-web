import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  MapPin,
  Loader2,
  Clock,
  DollarSign,
  MessageSquare,
  UserCheck,
  CornerDownRight,
  Send,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { ContactModal } from "../components/chat/ContactModal";
import type { Professional, ProfessionalService } from "../types/professional";

interface ReviewItem {
  id: string;
  calificacion: number;
  comentario?: string | null;
  fotosUrls: string[];
  respuestaProfesional?: string | null;
  fechaRespuesta?: string | null;
  createdAt: string;
  cliente: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil?: string | null;
  };
}

export const ProfessionalProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [profesional, setProfesional] = useState<Professional | null>(null);
  const [servicios, setServicios] = useState<ProfessionalService[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsPage, setReviewsPage] = useState<number>(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState<number>(1);
  const [cargandoReviews, setCargandoReviews] = useState<boolean>(true);
  const [reviewsStats, setReviewsStats] = useState<{
    calificacionPromedio: number;
    totalResenas: number;
  }>({ calificacionPromedio: 0, totalResenas: 0 });

  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const [resProfesionales, resServicios] = await Promise.all([
          fetch("http://localhost:3000/api/profesionales/public", {
            signal: controller.signal,
          }),
          fetch(
            `http://localhost:3000/api/profesionales/public/${id}/services`,
            { signal: controller.signal }
          ),
        ]);

        if (!resProfesionales.ok) {
          throw new Error("No se pudo cargar el perfil del profesional");
        }

        const lista: Professional[] = await resProfesionales.json();
        setProfesional(lista.find((p) => p.id === id) ?? null);

        if (resServicios.ok) {
          const datos = await resServicios.json();
          setServicios(Array.isArray(datos) ? datos : []);
        } else {
          setServicios([]);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Error al cargar el perfil:", err);
        setError(
          err instanceof Error ? err.message : "Ocurrió un error inesperado"
        );
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargar();
    window.scrollTo({ top: 0 });

    return () => controller.abort();
  }, [id]);

  // Carga de reseñas dinámicas (GET /api/professionals/:id/reviews)
  useEffect(() => {
    let ignore = false;
    const fetchReviews = async () => {
      if (!id) return;
      setCargandoReviews(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/professionals/${id}/reviews?page=${reviewsPage}&limit=5`
        );
        if (res.ok && !ignore) {
          const json = await res.json();
          if (json.ok && json.data) {
            setReviews(json.data.resenas || []);
            if (json.data.stats) {
              setReviewsStats(json.data.stats);
            }
            if (json.data.pagination) {
              setReviewsPage(json.data.pagination.page);
              setReviewsTotalPages(json.data.pagination.totalPages);
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error al cargar opiniones del profesional:", err);
        }
      } finally {
        if (!ignore) {
          setCargandoReviews(false);
        }
      }
    };

    void fetchReviews();
    return () => {
      ignore = true;
    };
  }, [id, reviewsPage]);

  // Enviar réplica única (POST /api/reviews/:id/reply)
  const handleEnviarRespuesta = async (reviewId: string) => {
    if (!replyText.trim() || !token) return;
    setEnviandoRespuesta(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/reviews/${reviewId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ respuesta: replyText.trim() }),
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.detalle || json.error || "Error al publicar la respuesta"
        );
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
              ...r,
              respuestaProfesional: replyText.trim(),
              fechaRespuesta: new Date().toISOString(),
            }
            : r
        )
      );
      setReplyingToId(null);
      setReplyText("");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo registrar la réplica.";
      alert(msg);
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const volver = (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-bold text-dark/70 dark:text-gray-300 hover:text-primary transition-colors mb-6"
    >
      <ArrowLeft size={18} />
      Volver
    </Link>
  );

  if (cargando) {
    return (
      <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg">
        <Navbar />
        <section className="px-4 py-8 max-w-4xl mx-auto w-full">
          {volver}
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg">
        <Navbar />
        <section className="px-4 py-8 max-w-4xl mx-auto w-full">
          {volver}
          <div className="bg-red-50/20 border border-red-100 rounded-xl p-6 text-center text-red-400">
            <p className="font-medium">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!profesional) {
    return (
      <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg">
        <Navbar />
        <section className="px-4 py-8 max-w-4xl mx-auto w-full">
          {volver}
          <div className="p-12 text-center">
            <p className="text-dark dark:text-gray-200 font-bold text-lg">
              No encontramos a este profesional.
            </p>
            <p className="text-dark/60 dark:text-gray-400 text-sm mt-1">
              Puede que ya no esté disponible.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const nombre = `${profesional.usuario.nombre} ${profesional.usuario.apellido}`;
  const isCurrentPro = Boolean(
    user?.id && (user.id === profesional.id || user.id === profesional.usuario.id)
  );

  const rating =
    reviewsStats.totalResenas > 0
      ? reviewsStats.calificacionPromedio
      : Number(profesional.calificacion_promedio) || 0;
  const totalResenas =
    reviewsStats.totalResenas > 0
      ? reviewsStats.totalResenas
      : profesional.totalResenas ?? profesional.total_resenas ?? 0;

  return (
    <main className="min-h-screen pb-20 bg-background dark:bg-dark-bg transition-colors duration-200 font-sans">
      <Navbar />
      <section className="px-4 py-8 max-w-4xl mx-auto w-full">
        {volver}

        {/* Cabecera Principal del Perfil */}
        <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {profesional.usuario.foto_perfil ? (
              <img
                src={profesional.usuario.foto_perfil}
                alt={nombre}
                className="w-24 h-24 rounded-full object-cover border border-gray-100 dark:border-gray-700 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary text-2xl font-bold flex items-center justify-center border border-gray-100 dark:border-gray-700">
                {profesional.usuario.nombre?.[0] ?? "?"}
                {profesional.usuario.apellido?.[0] ?? ""}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#283593] dark:text-white flex items-center justify-center sm:justify-start gap-2">
                {nombre}
                {profesional.estado_validado && (
                  <BadgeCheck size={22} className="text-[#00BFA5]" />
                )}
              </h1>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profesional.oficios.map((oficio) => (
                  <span
                    key={oficio.id}
                    className="px-2.5 py-1 bg-amber-500/10 text-[#FF8C00] rounded-lg text-xs font-bold"
                  >
                    {oficio.nombre_oficio}
                  </span>
                ))}
              </div>

              {/* Bloque Estelar debajo de la cabecera */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm font-medium text-dark/60 dark:text-gray-400">
                <div className="flex items-center gap-1.5 font-bold text-dark dark:text-gray-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                  <Star
                    size={18}
                    className="text-[#F59E0B] fill-[#F59E0B]"
                  />
                  <span className="text-base text-slate-900 dark:text-white font-extrabold">
                    {rating > 0 ? rating.toFixed(1) : "Nuevo"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-400 font-semibold ml-0.5">
                    ({totalResenas} {totalResenas === 1 ? "opinión" : "opiniones"})
                  </span>
                </div>

                <span className="flex items-center gap-1">
                  <MapPin size={16} className="text-slate-400" />
                  {profesional.ubicacion_geografica ?? "Ubicación no disponible"}
                </span>

                <span className="flex items-center gap-1.5 text-xs text-[#00BFA5] font-bold">
                  <ShieldCheck size={16} />
                  Garantía Closed-Loop
                </span>

                {profesional.experiencia ? (
                  <span className="flex items-center gap-1.5 text-xs text-[#FF8C00] font-bold bg-orange-50 dark:bg-orange-950/30 px-3 py-1 rounded-xl border border-orange-200/50 dark:border-orange-900/40">
                    <Award size={16} />
                    {profesional.experiencia}{" "}
                    {profesional.experiencia === 1 ? "año" : "años"} de experiencia
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {profesional.descripcion_perfil && (
            <p className="mt-6 text-dark/70 dark:text-gray-300 leading-relaxed text-sm">
              {profesional.descripcion_perfil}
            </p>
          )}

          {isCurrentPro ? (
            <div className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
              <UserCheck size={18} />
              <span>Tu perfil profesional</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                setShowContactModal(true);
              }}
              className="mt-6 w-full sm:w-auto px-8 py-3 bg-[#FF8C00] text-white font-bold rounded-xl hover:bg-[#E67E00] shadow-md shadow-[#FF8C00]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare size={18} />
              <span>Contactar Profesional</span>
            </button>
          )}
        </div>

        {/* Sección: Servicios Publicados */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-[#283593] dark:text-white mb-4">
            Servicios publicados
          </h2>

          {servicios.length === 0 ? (
            <p className="text-dark/60 dark:text-gray-400 text-sm">
              Este profesional todavía no publicó servicios.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicios.map((servicio) => (
                <div
                  key={servicio.id}
                  className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
                >
                  <h3 className="font-bold text-dark dark:text-white">
                    {servicio.titulo_servicio}
                  </h3>
                  <p className="text-sm text-dark/60 dark:text-gray-400 mt-1">
                    {servicio.descripcion_servicio}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-bold text-dark dark:text-gray-200">
                    <span className="flex items-center gap-1 text-[#00BFA5]">
                      <DollarSign size={16} />$
                      {servicio.costo_estimado.toLocaleString("es-AR")}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={16} />
                      {servicio.duracion_estimada}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección: Opiniones de Clientes */}
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-xl font-black text-[#283593] dark:text-white flex items-center gap-2">
                Opiniones de clientes
                <span className="text-sm font-semibold text-slate-400">
                  ({totalResenas})
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Calificaciones 100% verificadas provenientes de trabajos
                concretados y pagos liberados.
              </p>
            </div>

            {totalResenas > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-1.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 w-fit">
                <Star size={16} className="text-[#F59E0B] fill-[#F59E0B]" />
                <span className="text-sm font-black text-slate-800 dark:text-white">
                  {rating.toFixed(1)} de 5
                </span>
              </div>
            )}
          </div>

          {cargandoReviews ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="animate-spin text-[#FF8C00]" size={28} />
            </div>
          ) : reviews.length === 0 ? (
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
              <MessageSquare
                size={36}
                className="mx-auto text-slate-300 dark:text-gray-600 mb-2"
              />
              <p className="text-dark dark:text-gray-200 font-bold text-base">
                Aún no hay opiniones registradas.
              </p>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                Los clientes pueden calificar únicamente una vez que el profesional
                finaliza el trabajo y el pago en custodia es liberado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => {
                const clienteNombre = rev.cliente
                  ? `${rev.cliente.nombre} ${rev.cliente.apellido?.[0] ? rev.cliente.apellido[0] + "." : ""}`.trim()
                  : "Cliente Verificado";

                return (
                  <div
                    key={rev.id}
                    className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm transition-all"
                  >
                    {/* Header de la Reseña */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {rev.cliente?.foto_perfil ? (
                          <img
                            src={rev.cliente.foto_perfil}
                            alt={clienteNombre}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#00BFA5]/15 text-[#00BFA5] font-black text-sm flex items-center justify-center border border-[#00BFA5]/20">
                            {clienteNombre[0] || "C"}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {clienteNombre}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-[#00BFA5] border border-teal-200/50 dark:border-teal-900/40">
                              <ShieldCheck size={11} />
                              Verificado
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {new Date(rev.createdAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Estrellas */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= rev.calificacion
                                ? "text-[#F59E0B] fill-[#F59E0B]"
                                : "text-slate-200 dark:text-gray-700"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comentario */}
                    {rev.comentario && (
                      <p className="mt-3 text-sm text-slate-700 dark:text-gray-300 leading-relaxed pl-1">
                        {rev.comentario}
                      </p>
                    )}

                    {/* Fotos adjuntas de la reseña (hasta 2) con click para zoom */}
                    {rev.fotosUrls && rev.fotosUrls.length > 0 && (
                      <div className="flex items-center gap-3 mt-3 pl-1">
                        {rev.fotosUrls.map((url, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => setExpandedPhoto(url)}
                            className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={url}
                              alt={`Evidencia ${fIdx + 1}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                              Ver
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Respuesta del Profesional Indentada */}
                    {rev.respuestaProfesional ? (
                      <div className="mt-4 ml-4 sm:ml-8 p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border-l-4 border-[#00BFA5] border-t border-r border-b border-teal-100 dark:border-teal-900/30">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#00BFA5]">
                            <CornerDownRight size={14} />
                            <span>Respuesta de {profesional.usuario.nombre}</span>
                          </div>
                          {rev.fechaRespuesta && (
                            <span className="text-[11px] text-slate-400">
                              {new Date(rev.fechaRespuesta).toLocaleDateString(
                                "es-AR",
                                { day: "2-digit", month: "short" }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-gray-300 italic leading-relaxed">
                          "{rev.respuestaProfesional}"
                        </p>
                      </div>
                    ) : isCurrentPro ? (
                      /* Vista de Réplica (Profesional) */
                      <div className="mt-3 pl-1">
                        {replyingToId === rev.id ? (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-bg border border-slate-200 dark:border-gray-800 space-y-3">
                            <label className="block text-xs font-bold text-slate-700 dark:text-gray-300">
                              Responder a la opinión de {clienteNombre}:
                            </label>
                            <textarea
                              rows={3}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Escribe tu réplica pública y profesional..."
                              disabled={enviandoRespuesta}
                              className="w-full text-xs sm:text-sm p-3 rounded-lg border border-slate-300 dark:border-gray-700 bg-white dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                            />
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                              <AlertCircle size={14} />
                              <span>
                                Esta respuesta es pública, definitiva y no podrá
                                ser editada ni eliminada.
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToId(null);
                                  setReplyText("");
                                }}
                                disabled={enviandoRespuesta}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEnviarRespuesta(rev.id)}
                                disabled={enviandoRespuesta || !replyText.trim()}
                                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FF8C00] text-white hover:bg-[#E67E00] transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-sm shadow-[#FF8C00]/30"
                              >
                                {enviandoRespuesta ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Send size={13} />
                                )}
                                <span>Publicar réplica</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(rev.id);
                              setReplyText("");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF8C00] hover:text-[#E67E00] transition-colors cursor-pointer"
                          >
                            <MessageSquare size={13} />
                            <span>Responder a este cliente</span>
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {/* Paginación */}
              {reviewsTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                    disabled={reviewsPage === 1 || cargandoReviews}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </button>
                  <span className="text-xs text-slate-500 font-semibold">
                    Página {reviewsPage} de {reviewsTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setReviewsPage((p) => Math.min(reviewsTotalPages, p + 1))
                    }
                    disabled={
                      reviewsPage === reviewsTotalPages || cargandoReviews
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Siguiente
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox / Modal para foto ampliada */}
      {expandedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setExpandedPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <img
              src={expandedPhoto}
              alt="Evidencia ampliada"
              className="w-full h-full object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}

      {profesional && (
        <ContactModal
          isOpen={showContactModal}
          professionalId={profesional.id}
          professionalName={`${profesional.usuario.nombre} ${profesional.usuario.apellido}`}
          professionalPhoto={profesional.usuario.foto_perfil}
          profession={profesional.oficios?.[0]?.nombre_oficio}
          onClose={() => setShowContactModal(false)}
          onSuccess={(solicitudId) => {
            setShowContactModal(false);
            navigate(`/chats?chatId=${solicitudId}`);
          }}
        />
      )}
    </main>
  );
};
