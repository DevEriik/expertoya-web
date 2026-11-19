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

  return (
    <section className="px-4 py-8 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-dark dark:text-white mb-6 text-center md:text-left transition-colors">
        O explora por categorías
      </h2>

      <div className="flex flex-wrap justify-center md:justify-start gap-3">
        {categories.map((category) => (
          <button
            key={category}
            className="px-6 py-2.5 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl text-dark dark:text-gray-200 font-medium hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all cursor-pointer"
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  );
};
