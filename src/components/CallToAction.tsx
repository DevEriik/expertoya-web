import { UserPlus, Briefcase, User } from "lucide-react";
import { Link } from "react-router-dom";

export const CallToAction = () => {
  return (
    <section className="px-4 py-12 mb-16 max-w-5xl mx-auto w-full">
      <div className="bg-dark rounded-[2rem] p-10 md:p16 text-center text-white flex flex-col items-center shadow-xl">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
          ¿Listo para empezar?
        </h2>
        <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed font-medium">
          Únete a la comunidad de ExpertoYa. Ya sea que necesites resolver un
          problema urgente en casa o quieras ofrecer tus servicios como
          profesional.
        </p>

        <div className="flex flex-col sm: sm:flex-row gap-4 w-full justify-center">
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-md shadow-primary/20 text-lg"
          >
            <UserPlus size={22} />
            Soy Cliente
          </Link>
          <Link
            to="/register"
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-dark font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 shadow-md text-lg"
          >
            <Briefcase size={22} />
            Soy Profesional
          </Link>
        </div>
      </div>
    </section>
  );
};
