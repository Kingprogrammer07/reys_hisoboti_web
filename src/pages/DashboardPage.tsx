import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, DashboardStatsResponse } from "../api";
import { Truck, Scale, PackageCheck, ArrowUpRight, Plus, CheckCircle2, Clock, Inbox, RefreshCw } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(() => {
    try {
      const cached = sessionStorage.getItem("dashboard_stats_cache");
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !sessionStorage.getItem("dashboard_stats_cache"));

  const fetchStats = async (isManual = false) => {
    try {
      if (isManual || !stats) {
        setLoading(true);
      }
      const res = await dashboardApi.getStats();
      setStats(res);
      sessionStorage.setItem("dashboard_stats_cache", JSON.stringify(res));
    } catch (err) {
      console.warn("Dashboard statistikasini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalNetWeight = stats?.total_net_weight ?? 0;
  const totalEntriesCount = stats?.total_entries_count ?? 0;
  const activeTovarTypesCount = stats?.active_tovar_types_count ?? 0;
  const todayAddedKg = stats?.today_added_kg ?? 0;
  const inventory = stats?.inventory ?? [];
  const activities = stats?.recent_activities ?? [];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-8">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Boshqaruv Paneli</h1>
          <p className="text-xs text-muted-foreground">Mandarin hisobot tizimi umumiy statistikasi</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Umumiy Sof Vazn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {totalNetWeight.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
            <span>Bugun +{todayAddedKg.toLocaleString()} kg qo'shildi</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Kiritishlar Soni</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {totalEntriesCount} <span className="text-xs font-normal text-muted-foreground">ta yozuv</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span>{activities.length > 0 ? `So'nggi yozuv: ${activities[0].created_at}` : "Yozuvlar mavjud emas"}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Faol Tovar Turlari</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {activeTovarTypesCount} <span className="text-xs font-normal text-muted-foreground">tur</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            <span>{stats?.cargos_count || 0} ta kargo, {stats?.reys_count || 0} ta reys</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory Table & Recent Activities */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Inventory Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">Tovar balansi</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Joriy hisoblangan zaxira</p>
            </div>
            <Link
              to="/reports/cargos"
              className="inline-flex items-center space-x-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Yangi kirim</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
                <thead className="border-b border-border bg-muted/30 text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap">Tovar turi</th>
                    <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap">Koeffitsient</th>
                    <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-right whitespace-nowrap">Qoplar soni</th>
                    <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-right whitespace-nowrap">Sof balans (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && inventory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-xs">
                        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" />
                        Yuklanmoqda...
                      </td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-xs">
                        <Inbox className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                        Hozircha hech qanday tovar kiritilmagan.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-medium text-foreground whitespace-nowrap">{item.tovar_turi}</td>
                        <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                            {item.box_coefficient} kg
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-right text-muted-foreground whitespace-nowrap">{item.package_count || "-"}</td>
                        <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-right font-semibold text-emerald-400 whitespace-nowrap">
                          {item.balance_weight.toLocaleString()} kg
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity Side Widget (1 col) */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">So'nggi harakatlar</h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Oxirgi kiritilgan partiyalar</p>
            </div>
            <Link to="/activity" className="text-xs text-primary hover:underline">
              Barchasi &rarr;
            </Link>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {loading && activities.length === 0 ? (
              <div className="p-6 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-primary" />
                Yuklanmoqda...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-6 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                Hozircha faoliyat qayd etilmagan.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-sm space-y-1.5 sm:space-y-2 hover:border-muted-foreground/30 transition-colors">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-primary truncate">{act.tovar_turi}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{act.created_at}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sof: <strong className="text-foreground">{act.net_weight} kg</strong></span>
                    <span className="text-muted-foreground">Manba: <strong className="text-foreground">{act.created_by}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
