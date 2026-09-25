export const Categories = () => {
  const categories = [
    "Plomero",
    "Electricista",
    "Gasista",
    "Cerrajero",
    "Albañil",
    "Pintor",
    "Carpintero",
  ];
  const noSirvo = "hola";

  return (
    <section className="px-4 py-8 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-dark mb-6 text-center md:text-left">
        O explora por categorías
      </h2>

      <div className="flex flex-wrap justify-center md:justify-start gap-3">
        {categories.map((category) => (
          <button
            key={category}
            className="px-6 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl text-dark font-medium hover:border-primary hover:text-primary transition-colors"
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
};
