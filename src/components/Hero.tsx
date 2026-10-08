import { Sparkles, Mic, Camera } from "lucide-react";
import { useState, useRef } from "react";

export const Hero = () => {
  const [busqueda, setBusqueda] = useState("");
  const [escuchando, setEscuchando] = useState(false);

  const recognitionRef = useRef<any>(null);

  const toggleDictado = () => {
    if (escuchando && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Tu navegador actual no soporta el dictado por voz.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setEscuchando(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join("");
      setBusqueda(transcript);
    };
    recognition.onend = () => setEscuchando(false);

    recognition.onerror = (event: any) => {
      console.error("Error en dictado:", event.error);
      setEscuchando(false);
    };

    recognitionRef.current = recognition;
    setBusqueda("");
    recognition.start();
  };

  return (
    <section className="px-4 py-8 md:py-12 max-w-5xl mx-auto w-full">
      <div className="bg-white rounded-[2rem] shadow-[0_4px_40px_-10px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col items-center text-center px-4 py-16 md:py-24 w-full">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-8 text-center">
          <Sparkles size={16} className="shrink-0" />
          <span>Búsqueda con Inteligencia Artificial</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-dark mb-6 leading-tight">
          ¿No estás seguro de a qué
          <br className="hidden md:block" /> especialista llamar?
        </h1>

        <p className="text-dark/70 text-lg md:text-xl mb-12 max-w-2xl">
          Describe tu problema o sube una foto/video, y nuestra IA te conectará
          al instante con el experto exacto que necesitas.
        </p>

        <div
          className={`w-full max-w-3xl flex flex-col md:flex-row items-center gap-3 bg-white p-2.5 rounded-2xl shadow-md border transition-colors ${escuchando ? "border-primary shadow-primary/20" : "border-gray-100"}`}
        >
          <div className="flex-1 flex items-center justify-between w-full px-2">
            <input
              type="text"
              placeholder={
                escuchando
                  ? "Escuchando... (Vuelve a hacer click para detener)"
                  : "Ej., Tengo una pérdida de agua..."
              }
              className="w-full pl-2 pr-2 py-3 outline-none text-dark bg-transparent font-medium text-[16px] md:text-lg placeholder:text-gray-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <div className="flex items-center gap-3 md:gap-4 text-dark/40 px-2 shrink-0">
              <button
                type="button"
                onClick={toggleDictado}
                className={`p-2 rounded-full transition-all ${escuchando ? "bg-primary/10 text-primary animate-pulse" : "hover:bg-gray-100 hover:text-primary"}`}
                title="Dictado por voz"
              >
                <Mic size={22} />
              </button>

              <button
                type="button"
                className="p-2 rounded-full hover:bg-gray-100 hover:text-primary transition-all"
              >
                <Camera size={22} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="w-full md:w-auto shrink-0 px-8 py-4 bg-secondary hover:opacity-90 transition-opacity text-white font-bold rounded-xl flex items-center justify-center gap-2 text-lg"
          >
            <Sparkles size={20} />
            <span className="whitespace-nowrap">Preguntar a la IA</span>
          </button>
        </div>
      </div>
    </section>
  );
};
