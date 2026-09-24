import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
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
import { RecycleBinPage } from "./pages/reports/RecycleBinPage";
import { ReysDistributionFormPage } from "./pages/reports/ReysDistributionFormPage";
import { ReysDistributionListPage } from "./pages/reports/ReysDistributionListPage";

const AppContent: React.FC = () => {
  const location = useLocation();
  const isEntryPage = location.pathname.includes("/entry") || location.pathname.includes("/distribute");
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden w-full max-w-full">
      <Navbar />
      <main
        className={`flex-1 mx-auto w-full max-w-7xl ${
          isEntryPage
            ? "px-2 sm:px-4 py-2 sm:py-3"
            : "px-3 sm:px-6 lg:px-8 py-4 sm:py-6"
        }`}
      >
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsMenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/cargos"
            element={
              <ProtectedRoute>
                <CargoListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/cargos/:cargoId"
            element={
              <ProtectedRoute>
                <CargoDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/reys"
            element={
              <ProtectedRoute>
                <ReysListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/reys/:reysId"
            element={
              <ProtectedRoute>
                <ReysDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/reys/:reysId/entry/:categoryId"
            element={
              <ProtectedRoute>
                <ReysEntryFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/reys/:reysId/entry/:categoryId/list"
            element={
              <ProtectedRoute>
                <ReysEntriesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/reys/:reysId/distribute"
            element={
              <ProtectedRoute>
                <ReysDistributionFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/reys/:reysId/distribute/list"
            element={
              <ProtectedRoute>
                <ReysDistributionListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <ActivityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bin"
            element={
              <ProtectedRoute>
                <RecycleBinPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isEntryPage && !isLoginPage && <MobileNav />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
