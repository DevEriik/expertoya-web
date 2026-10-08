import { Categories } from "./components/categories";
import { Hero } from "./components/Hero";
import { ProfessionalsNearYou } from "./components/ProfessionalsNearYou";
import { Navbar } from "./components/Navbar";
import { AdminRoute } from "./components/AdminRoute";
import { AdminBackoffice } from "./pages/AdminBackoffice";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { EscrowInfo } from "./components/EscrowInfo";
import { CallToAction } from "./components/CallToAction";

const PublicHome = () => (
  <main className="min-h-screen pb-20">
    <Navbar />
    <Hero />
    <Categories />
    <ProfessionalsNearYou />
    <EscrowInfo />
    <CallToAction />
  </main>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
    </AuthProvider>
  );
}

export default App;
