import { Categories } from "./components/categories";
import { Hero } from "./components/Hero";
import { ProfessionalsNearYou } from "./components/ProfessionalsNearYou";
import { Navbar } from "./components/Navbar";

function App() {
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
