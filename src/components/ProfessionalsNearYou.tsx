import { BadgeCheck, Star, MapPin } from "lucide-react";

export const ProfessionalsNearYou = () => {
  const professionals = [
    {
      id: 1,
      name: "Juan Pérez",
      trade: "Plomero Certificado",
      rating: 4.9,
      reviews: 124,
      location: "Plottier, Neuquén",
      image: "https://i.pravatar.cc/150?img=11",
    },
    {
      id: 2,
      name: "Erick Gonzalez",
      trade: "Maestro Electricista",
      rating: 4.8,
      reviews: 89,
      location: "Neuquén Capital",
      image: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 3,
      name: "Maria Silva",
      trade: "Gasista",
      rating: 5.0,
      reviews: 212,
      location: "Centenario, Neuquén",
      image: "https://i.pravatar.cc/150?img=5",
    },
  ];

  return (
    <section className="px-4 py-8 max-w-4xl mx-auto w-full mb-12">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-dark">
          Profesionales cerca de ti
        </h2>
        <a
          href="#"
          className="text-primary font-bold hover:underline hidden md:block"
        >
          Ver todos
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {professionals.map((pro) => (
          <div
            key={pro.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-start gap-4 mb-4">
              <img
                src={pro.image}
                alt={pro.name}
                className="w-14 h-14 rounded-full object-cover"
              />

              <div>
                <h3 className="font-bold text-dark flex items-center gap-1">
                  {pro.name}
                  <BadgeCheck size={18} className="text-succes" />
                </h3>
                <p className="text-sm text-dark/60 font-medium">{pro.trade}</p>

                <div className="flex items-center gap-1 mt-1 text-sm font-bold">
                  <Star size={14} className="text-warning fill-warning" />
                  <span className="text-dark">{pro.rating}</span>
                  <span className="text-dark/40 font-medium">
                    ({pro.reviews})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-dark/60 text-sm font-medium mb-6 mt-auto">
              <MapPin size={16} />
              {pro.location}
            </div>
            <button className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
              Contratar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center md:hidden">
        <a href="#" className="text-primary font-bold hover:underline">
          Ver todos los profesionales
        </a>
      </div>
    </section>
  );
};
