import { Categories } from "./components/categories";
import { Hero } from "./components/Hero";
import { ProfessionalsNearYou } from "./components/ProfessionalsNearYou";
import { Navbar } from "./components/Navbar";
import { AdminRoute } from "./components/AdminRoute";
import { AdminBackoffice } from "./pages/AdminBackoffice";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const PublicHome = () => (
  <main className="min-h-screen pb-20">
    <Navbar />
    <Hero />
    <Categories />
    <ProfessionalsNearYou />
  </main>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminBackoffice />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
