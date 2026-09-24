import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { NetworkStatusBadge } from "./NetworkStatusBadge";
import { LayoutDashboard, Truck, History, ShieldCheck, Sun, Moon, FileSpreadsheet, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);

  // Listen to body class 'camera-active' so top navbar unmounts when camera or lightbox is open
  const [isCameraActive, setIsCameraActive] = useState<boolean>(() => 
    typeof document !== "undefined" && document.body.classList.contains("camera-active")
  );

  useEffect(() => {
    const checkState = () => {
      setIsCameraActive(document.body.classList.contains("camera-active"));
    };

    checkState();

    const observer = new MutationObserver(checkState);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("camera-state-change", checkState);

    return () => {
      observer.disconnect();
      window.removeEventListener("camera-state-change", checkState);
    };
  }, []);

  if (isCameraActive) {
    return null;
  }

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const navItems = [
    { label: "Bosh sahifa", path: "/", icon: LayoutDashboard },
    { label: "Reyslar Hisoboti", path: "/reports", icon: Truck },
    { label: "Faollik jurnali", path: "/activity", icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Brand / Logo: Hisobot oynasi */}
        <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold tracking-tight text-foreground text-base sm:text-lg group-hover:text-emerald-400 transition-colors truncate">
                Hisobot oynasi
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">
              Reys hisoboti va monitoring
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <NetworkStatusBadge />
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Mavzuni almashtirish"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Auth Button & User Profile */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <User className="h-3.5 w-3.5" />
                <span>{user?.username || "admin"}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="flex items-center space-x-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95"
                title="Tizimdan chiqish"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 rounded-lg bg-primary px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-lg shadow-emerald-500/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Tizimga kirish</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
