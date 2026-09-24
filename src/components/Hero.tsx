import { Sparkles, Mic, Camera } from "lucide-react";
export const Hero = () => {
  return (
    <section className="flex flex-col items-center text-center px-4 py-12 mt-8 max-w-4xl mx-auto">
      <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-6 text-center">
        <Sparkles size={16} className="shrink-0" />
        <span>Búsqueda con Inteligencia Artificial</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold text-dark mb-4 leading-tight">
        ¿No estás seguro de a qué
        <br className="hidden md:block" /> especialista llamar?
      </h1>

      <p className="text-dark/70 text-lg md:text-xl mb-8 max-w-2xl">
        Describe tu problema o sube una foto/video, y nuestra IA te conectará al
        instante con el experto exacto que necesitas.
      </p>

      <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 flex items-center w-full px-2">
          <input
            type="text"
            placeholder="Ej., Tengo una pérdida de agua en la pared..."
            className="w-full pl-2 pr-2 py-3 outline-none text-dark bg-transparent font-medium"
          />

          <div className="hidden md:flex items-center gap-3 text-dark/40 px-3 shrink-0">
            <Mic
              size={20}
              className="hover:text-primary cursor-pointer transition-colors"
            />
            <Camera
              size={20}
              className="hover:text-primary cursor-pointer transition-colors"
            />
          </div>
        </div>

        <button className="w-full md:w-auto shrink-0 px-6 py-3 bg-secondary hover:opacity-90 transition-opacity text-white font-bold rounded-xl flex items-center justify-center gap-2">
          <Sparkles size={18} />
          <span className="whitespace-nowrap">Preguntar a la IA</span>
        </button>
      </div>
    </section>
  );
};
