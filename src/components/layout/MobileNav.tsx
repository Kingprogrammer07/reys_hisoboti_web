import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Truck, History, User } from "lucide-react";

export const MobileNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: "Bosh sahifa", path: "/", icon: LayoutDashboard },
    { label: "Reyslar", path: "/reports", icon: Truck },
    { label: "Faollik", path: "/activity", icon: History },
    { label: "Kirish", path: "/login", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/10 bg-background/90 backdrop-blur-xl">
      <nav className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary animate-pulse" : ""}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
