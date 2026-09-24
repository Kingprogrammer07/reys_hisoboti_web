import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Truck, History, Trash2 } from "lucide-react";

export const MobileNav: React.FC = () => {
  const location = useLocation();

  // Listen to body class 'camera-active' so it unmounts immediately when camera opens
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

  // Check if current page is an entry workflow page (/reports/reys/:id/entry/...)
  const isEntryPage = location.pathname.includes("/entry");

  // If camera, fullscreen lightbox, or entry workflow page is active, do not render bottom navbar at all
  if (isCameraActive || isEntryPage) {
    return null;
  }

  const navItems = [
    { label: "Boshqaruv", path: "/", icon: LayoutDashboard },
    { label: "Hisobotlar", path: "/reports", icon: Truck },
    { label: "Faollik", path: "/activity", icon: History },
    { label: "Savatcha", path: "/bin", icon: Trash2 },
  ];

  return (
    <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-white/10 bg-background/90 backdrop-blur-xl">
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
