import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { MobileNav } from "./components/layout/MobileNav";
import { DashboardPage } from "./pages/DashboardPage";
import { ReportsMenuPage } from "./pages/reports/ReportsMenuPage";
import { CargoListPage } from "./pages/reports/CargoListPage";
import { CargoDetailPage } from "./pages/reports/CargoDetailPage";
import { ReysListPage } from "./pages/reports/ReysListPage";
import { ReysDetailPage } from "./pages/reports/ReysDetailPage";
import { ReysEntryFormPage } from "./pages/reports/ReysEntryFormPage";
import { ReysEntriesListPage } from "./pages/reports/ReysEntriesListPage";
import { ActivityPage } from "./pages/ActivityPage";
import { LoginPage } from "./pages/LoginPage";

import { useLocation } from "react-router-dom";

const AppContent: React.FC = () => {
  const location = useLocation();
  const isEntryPage = location.pathname.includes("/entry");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className={`flex-1 mx-auto w-full max-w-7xl ${isEntryPage ? "px-2 sm:px-4 py-2 sm:py-3" : "px-3 sm:px-6 lg:px-8 py-4 sm:py-6"}`}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          
          {/* Explicit Sub-Routes for Reports Section */}
          <Route path="/reports" element={<ReportsMenuPage />} />
          <Route path="/reports/cargos" element={<CargoListPage />} />
          <Route path="/reports/cargos/:cargoId" element={<CargoDetailPage />} />
          <Route path="/reports/reys" element={<ReysListPage />} />
          <Route path="/reports/reys/:reysId" element={<ReysDetailPage />} />
          <Route path="/reports/reys/:reysId/entry/:categoryId" element={<ReysEntryFormPage />} />
          <Route path="/reports/reys/:reysId/entry/:categoryId/list" element={<ReysEntriesListPage />} />

          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      {!isEntryPage && <MobileNav />}
    </div>
  );
};


export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};


export default App;
