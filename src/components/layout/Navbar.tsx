import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Truck, History, LogIn, ShieldCheck, Sun, Moon, Globe } from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isDark, setIsDark] = React.useState(true);

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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-foreground text-lg">
                Mandarin <span className="gradient-text">Logistics</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <Globe className="mr-1 h-3 w-3" /> Standalone Web
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Reys Hisoboti va Ombor Monitoringi
            </p>
          </div>
        </div>

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
        <div className="flex items-center space-x-3">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Mavzuni almashtirish"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Auth Button */}
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-orange-500/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Tizimga kirish</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
