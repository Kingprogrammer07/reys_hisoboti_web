import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  dashboardApi,
  DashboardStatsResponse,
  downloadFile,
} from "../api";
import {
  Scale,
  Truck,
  PackageCheck,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
  Inbox,
  RefreshCw,
  FileSpreadsheet,
  ChevronRight,
  Layers,
  Calendar,
  Boxes,
  Trash2,
  Sparkles,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(() => {
    try {
      const cached = sessionStorage.getItem("dashboard_stats_cache");
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !sessionStorage.getItem("dashboard_stats_cache"));
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  const handleExportSummaryExcel = async () => {
    try {
      setExportingExcel(true);
      const filename = `Mandarin_Umumiy_Hisobot_${new Date().toISOString().slice(0, 10)}.xlsx`;
      await downloadFile("/api/export/summary", filename);
      showToast("Excel hisoboti muvaffaqiyatli yuklab olindi");
    } catch (err: any) {
      showToast("Excel yuklashda xatolik: " + (err?.message || "Server xatosi"));
    } finally {
      setExportingExcel(false);
    }
  };

  const totalNetWeight = stats?.total_net_weight ?? 0;
  const totalGrossWeight = stats?.total_gross_weight ?? (totalNetWeight + (stats?.total_karobka_weight ?? 0));
  const totalKarobkaWeight = stats?.total_karobka_weight ?? 0;
  const totalEntriesCount = stats?.total_entries_count ?? 0;
  const cargosCount = stats?.cargos_count ?? 0;
  const reysCount = stats?.reys_count ?? 0;
  const activeTovarTypesCount = stats?.active_tovar_types_count ?? 0;
  const todayAddedKg = stats?.today_added_kg ?? 0;
  const todayEntriesCount = stats?.today_entries_count ?? 0;
  const cargosStats = stats?.cargos_stats ?? [];
  const recentReyslar = stats?.recent_reyslar ?? [];
  const inventory = stats?.inventory ?? [];
  const activities = stats?.recent_activities ?? [];

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-12 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500/90 text-white px-4 py-3 shadow-xl backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <span>Boshqaruv Paneli</span>
            <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 border border-emerald-500/20">
              Jonli hisobot
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mandarin hisobot tizimi, kargolar faoliyati va ombor zaxiralari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Yangilash</span>
          </button>
          <button
            onClick={handleExportSummaryExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/30 active:scale-95"
            title="Umumiy Excel hisobotini yuklab olish"
          >
            <FileSpreadsheet className={`h-3.5 w-3.5 ${exportingExcel ? "animate-spin" : ""}`} />
            <span>Excel hisobot</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Link
          to="/reports/cargos"
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/40 hover:bg-muted/30 transition-all shadow-sm group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
            <Plus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground group-hover:text-emerald-400 transition-colors truncate">Yangi Kargo</p>
            <p className="text-[10px] text-muted-foreground truncate">Kargo yaratish</p>
          </div>
        </Link>

        <Link
          to="/reports/reys"
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-card hover:border-blue-500/40 hover:bg-muted/30 transition-all shadow-sm group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors truncate">Reyslar</p>
            <p className="text-[10px] text-muted-foreground truncate">Yangi reys qo'shish</p>
          </div>
        </Link>

        <Link
          to={recentReyslar[0] ? `/reports/reys/${recentReyslar[0].id}/distribute` : "/reports/reys"}
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-card hover:border-purple-500/40 hover:bg-muted/30 transition-all shadow-sm group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors truncate">Tarqatish</p>
            <p className="text-[10px] text-muted-foreground truncate">Kargolarga tarqatish</p>
          </div>
        </Link>

        <Link
          to="/bin"
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-border/80 bg-card hover:border-rose-500/40 hover:bg-muted/30 transition-all shadow-sm group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
            <Trash2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground group-hover:text-rose-400 transition-colors truncate">Savatcha</p>
            <p className="text-[10px] text-muted-foreground truncate">O'chirilganlarni tiklash</p>
          </div>
        </Link>
      </div>

      {/* 3. Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Sof Vazn */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Umumiy Sof Vazn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalNetWeight.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400 font-semibold">
            <ArrowUpRight className="mr-1 h-3.5 w-3.5 shrink-0" />
            <span>Bugun +{todayAddedKg.toLocaleString()} kg ({todayEntriesCount} quti)</span>
          </div>
        </div>

        {/* Metric 2: Umumiy og'irlik & Karobka */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Umumiy og'irlik / Karobka</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalGrossWeight.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-amber-400 font-medium">
            <span>Karobka og'irligi: <strong>{totalKarobkaWeight.toLocaleString()} kg</strong></span>
          </div>
        </div>

        {/* Metric 3: Kiritishlar Soni */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kiritilgan Qutilar</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalEntriesCount} <span className="text-xs font-normal text-muted-foreground">ta yozuv</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Layers className="mr-1 h-3.5 w-3.5 shrink-0" />
            <span>{activeTovarTypesCount} xil tovar kiritilgan</span>
          </div>
        </div>

        {/* Metric 4: Kargolar & Reyslar */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-purple-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kargo & Reyslar</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {cargosCount} <span className="text-xs font-normal text-muted-foreground">ta kargo</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5 shrink-0" />
            <span>{reysCount} ta faol reys mavjud</span>
          </div>
        </div>
      </div>

      {/* 4. Kargolar Statistikasi (Eski webdagi index.html kabi kargolar hisoboti) */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-400" />
              <span>Kargolar statistikasi</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Har bir kargo bo'yicha reyslar soni, qutilar, toza va karobka vaznlari
            </p>
          </div>
          <Link
            to="/reports/cargos"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
          >
            <span>Barcha kargolar</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {cargosStats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs font-medium text-muted-foreground">Hozircha kargolar mavjud emas</p>
            <Link
              to="/reports/cargos"
              className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Yangi kargo ochish</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {cargosStats.map((cargo) => (
              <div
                key={cargo.id}
                onClick={() => navigate(`/reports/cargos/${cargo.id}`)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all flex flex-col justify-between space-y-4"
              >
                {/* Cargo Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                      {cargo.code.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <h3 className="text-base font-extrabold text-foreground group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                        <span className="truncate">{cargo.code}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Oxirgi reys: {cargo.latest_date || "Kiritilmagan"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                      {cargo.reys_count} ta reys
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {cargo.entries_count} ta quti
                    </span>
                  </div>
                </div>

                {/* Weight Details */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Toza Vazn</span>
                    <strong className="text-sm font-extrabold text-emerald-400">
                      {cargo.total_toza_kg.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">kg</span>
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Karobka og'irligi</span>
                    <strong className="text-sm font-bold text-amber-400">
                      {cargo.total_karobka_plus_kg.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">kg</span>
                    </strong>
                  </div>
                </div>

                {/* Progress Bar of Weight Share */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                    <span>Umumiy vazndagi ulushi</span>
                    <strong className="text-foreground">{cargo.share_percentage}%</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(cargo.share_percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-1 text-xs" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/reports/cargos/${cargo.id}`}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Reyslarni ko'rish</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => navigate(`/reports/reys?cargo_id=${cargo.id}`)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-background/50 hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Filtrlash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. So'nggi Reyslar Tezkor Ko'rish */}
      {recentReyslar.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span>So'nggi reyslar</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Oxirgi kiritilgan va faol bo'lgan yuk reyslari
              </p>
            </div>
            <Link
              to="/reports/reys"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>Barcha reyslar</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentReyslar.map((reys) => (
              <div
                key={reys.id}
                onClick={() => navigate(`/reports/reys/${reys.id}`)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <h4 className="text-sm font-black text-foreground group-hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate">
                      <span>{reys.code}</span>
                      {reys.custom_name && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>{reys.custom_name}</span>
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Truck className="h-3 w-3" />
                      <span>{reys.cargo_code}</span>
                      <span>·</span>
                      <span>{reys.date}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-foreground shrink-0">
                    {reys.entries_count} ta quti
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Toza:</span>
                    <strong className="text-foreground">{reys.toza_kg.toLocaleString()} kg</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Karobka plus:</span>
                    <strong className="text-emerald-400">{reys.karobka_plus_kg.toLocaleString()} kg</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/reports/reys/${reys.id}/distribute`}
                    className="text-[11px] font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                  >
                    <span>Kargolarga tarqatish &rarr;</span>
                  </Link>
                  <Link
                    to={`/reports/reys/${reys.id}`}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Batafsil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Main Grid: Inventory Table & Recent Activities */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        {/* Inventory Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Boxes className="h-5 w-5 text-amber-400" />
                <span>Tovar balansi (Ombor zaxirasi)</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Hozirgi hisoblangan umumiy mahsulot qoldig'i</p>
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
                <thead className="border-b border-border bg-muted/40 text-[11px] sm:text-xs font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3.5 py-3 sm:px-4 whitespace-nowrap">Tovar turi</th>
                    <th className="px-3.5 py-3 sm:px-4 whitespace-nowrap">Koeffitsient</th>
                    <th className="px-3.5 py-3 sm:px-4 text-right whitespace-nowrap">Qoplar soni</th>
                    <th className="px-3.5 py-3 sm:px-4 text-right whitespace-nowrap">Sof balans (kg)</th>
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
                        <td className="px-3.5 py-3 sm:px-4 font-bold text-foreground whitespace-nowrap">{item.tovar_turi}</td>
                        <td className="px-3.5 py-3 sm:px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                            {item.box_coefficient} kg
                          </span>
                        </td>
                        <td className="px-3.5 py-3 sm:px-4 text-right text-muted-foreground whitespace-nowrap font-medium">{item.package_count || "-"}</td>
                        <td className="px-3.5 py-3 sm:px-4 text-right font-extrabold text-emerald-400 whitespace-nowrap">
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
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <span>So'nggi harakatlar</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Oxirgi kiritilgan qutilar tasmasi</p>
            </div>
            <Link to="/activity" className="text-xs font-bold text-emerald-400 hover:underline">
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
                <div key={act.id} className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-sm space-y-1.5 sm:space-y-2 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-emerald-400 truncate">
                      Karobka #{act.box_code} ({act.tovar_turi})
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{act.created_at}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Toza: <strong className="text-foreground">{act.net_weight} kg</strong></span>
                    <span className="text-muted-foreground">Og'irlik: <strong className="text-foreground">{act.gross_weight} kg</strong></span>
                  </div>
                  {act.photos_count > 0 && (
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                      <span>📷 {act.photos_count} ta fotosurat yuklangan</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
