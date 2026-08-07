import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { MobileNav } from "./components/layout/MobileNav";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsMenuPage } from "./pages/reports/ReportsMenuPage";
import { CargoListPage } from "./pages/reports/CargoListPage";
import { CargoDetailPage } from "./pages/reports/CargoDetailPage";
import { ReysListPage } from "./pages/reports/ReysListPage";
import { ActivityPage } from "./pages/ActivityPage";
import { LoginPage } from "./pages/LoginPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            
            {/* Explicit Sub-Routes for Reports Section */}
            <Route path="/reports" element={<ReportsMenuPage />} />
            <Route path="/reports/cargos" element={<CargoListPage />} />
            <Route path="/reports/cargos/:cargoId" element={<CargoDetailPage />} />
            <Route path="/reports/reys" element={<ReysListPage />} />

            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
