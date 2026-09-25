import { Categories } from "./components/categories";
import { Hero } from "./components/Hero";
import { ProfessionalsNearYou } from "./components/ProfessionalsNearYou";

function App() {
  return (
    <main className="min-h-screen pb-20">
      <Hero />
      <Categories />
      <ProfessionalsNearYou />
    </main>
  );
}

export default App;
