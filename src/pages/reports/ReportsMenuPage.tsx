import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Truck, RefreshCw } from "lucide-react";
import { fetchCargos, fetchReyslar } from "../../api";
import { BackupManagementCard } from "../../components/reports/BackupManagementCard";

// ROUTE: /reports
export const ReportsMenuPage: React.FC = () => {
  const [cargoCount, setCargoCount] = useState<number>(0);
  const [reysCount, setReysCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCounts = async () => {
    try {
      setLoading(true);
      const [cargosRes, reysRes] = await Promise.all([
        fetchCargos().catch(() => ({ items: [], total: 0 })),
        fetchReyslar().catch(() => ({ items: [], total: 0 })),
      ]);
      setCargoCount(cargosRes?.total ?? cargosRes?.items?.length ?? 0);
      setReysCount(reysRes?.total ?? reysRes?.items?.length ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Hisobotlar Bo'limi</h1>
        <p className="text-xs text-muted-foreground">Hisobot turini tanlang yoki ma'lumotlar bazasini zaxiralang</p>
      </div>

      {/* 2 MAIN CARDS WITH EXPLICIT ROUTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Card 1: Kargolar Hisoboti -> Route /reports/cargos */}
        <Link
          to="/reports/cargos"
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-left shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-98 glass-panel block"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Package className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1 text-emerald-400" />
              ) : null}
              {cargoCount} ta Kargo
            </span>
          </div>
          <div className="mt-6 space-y-2">
            <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-400 transition-colors">
              Kargolar Hisoboti
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kargolar kodi ro'yxati va har bir kargo ichidagi reyslar tahlili.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-400/80">
              URL: /reports/cargos
            </div>
          </div>
        </Link>

        {/* Card 2: Reyslar Hisoboti -> Route /reports/reys */}
        <Link
          to="/reports/reys"
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-left shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 active:scale-98 glass-panel block"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
              <Truck className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20">
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1 text-teal-400" />
              ) : null}
              {reysCount} ta Reys
            </span>
          </div>
          <div className="mt-6 space-y-2">
            <h2 className="text-xl font-bold text-foreground group-hover:text-teal-400 transition-colors">
              Reyslar Hisoboti
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Barcha reyslar kodi va vazn ko'rsatkichlari ro'yxati.
            </p>
            <div className="pt-2 text-[11px] font-mono text-teal-400/80">
              URL: /reports/reys
            </div>
          </div>
        </Link>

      </div>

      {/* Card 3: Ma'lumotlar xavfsizligi va Zaxiralash (Backup) */}
      <div className="pt-4">
        <BackupManagementCard />
      </div>
    </div>
  );
};
