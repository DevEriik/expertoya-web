import { Categories } from "./components/categories";
import { Hero } from "./components/Hero";
import { ProfessionalsNearYou } from "./components/ProfessionalsNearYou";
import { Navbar } from "./components/Navbar";

function App() {
  // Agrega esto justo antes del "return" de tu componente:
  const variableInutil = "Esta variable va a hacer enojar al linter";
  console.log("Testeando al guardián");
  return (
    <main className="min-h-screen pb-20">
      <Navbar />
      <Hero />
      <Categories />
      <ProfessionalsNearYou />
    </main>
  );
}

export default App;
