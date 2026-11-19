import { UserPlus, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export const CallToAction = () => {
  return (
    <section className="px-4 py-12 mb-16 max-w-5xl mx-auto w-full">
      <div className="bg-dark dark:bg-dark-surface rounded-[2rem] p-10 md:p-16 text-center text-white flex flex-col items-center shadow-xl dark:shadow-none border border-transparent dark:border-gray-800 transition-colors">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
          ¿Listo para empezar?
        </h2>
        <p className="text-white/80 dark:text-gray-300 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-medium">
          Únete a la comunidad de ExpertoYa. Ya sea que necesites resolver un
          problema urgente en casa o quieras ofrecer tus servicios como
          profesional.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            to="/register?rol=CLIENTE"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-md shadow-primary/20 text-lg"
          >
            <UserPlus size={22} />
            Soy Cliente
          </Link>
          <Link
            to="/register?rol=PROFESIONAL"
            className="flex items-center justify-center gap-2 bg-white dark:bg-dark-bg hover:bg-gray-50 dark:hover:bg-gray-800 text-dark dark:text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-md border border-transparent dark:border-gray-700 text-lg"
          >
            <Briefcase size={22} />
            Soy Profesional
          </Link>

        </div>
      </div>
    </section>
  );
};
