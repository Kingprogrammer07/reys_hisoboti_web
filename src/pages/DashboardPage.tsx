import React from "react";
import { MOCK_REPORTS, MOCK_INVENTORY, MOCK_ACTIVITIES } from "../mock/data";
import { Truck, Scale, PackageCheck, Activity, ArrowUpRight, Plus, RefreshCw, CheckCircle2, Clock } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const activeReport = MOCK_REPORTS.find((r) => r.is_active) || MOCK_REPORTS[0];

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-6 sm:p-8 border border-orange-500/20 glass-panel">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 ring-1 ring-inset ring-orange-500/20">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Faol Reys Monitoringi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {activeReport.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Yaratilgan vaqti: {activeReport.created_at} | Telegram Bot va Standalone Brauzer orqali to'g'ridan-to'g'ri integratsiyalangan.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Umumiy Sof Vazn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">
              {activeReport.total_net_weight.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
            <span>Bugun +1,240 kg qo'shildi</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Kiritishlar Soni</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">
              {activeReport.total_entries_count} <span className="text-xs font-normal text-muted-foreground">ta yozuv</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span>So'nggi yozuv 10 daqiqa oldin</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Faol Tovar Turlari</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-foreground">
              {MOCK_INVENTORY.length} <span className="text-xs font-normal text-muted-foreground">tur</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            <span>Barcha balanslar ijobiy</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Platforma Holati</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-emerald-400">Online & Standalone</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <span>Mustaqil domen & HTTPS</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Inventory Table & Recent Activities */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Inventory Summary (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Tovar Turlari Balansi</h2>
              <p className="text-xs text-muted-foreground">Amaldagi reys bo'yicha joriy zaxira balansi</p>
            </div>
            <button className="inline-flex items-center space-x-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md">
              <Plus className="h-3.5 w-3.5" />
              <span>Yangi kirim qilish</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Tovar Turi</th>
                  <th className="px-4 py-3">Koeffitsient</th>
                  <th className="px-4 py-3 text-right">Qoplar Soni</th>
                  <th className="px-4 py-3 text-right">Sof Balans (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MOCK_INVENTORY.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{item.tovar_turi}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                        {item.box_coefficient} kg
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{item.package_count || "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                      {item.balance_weight.toLocaleString()} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Side Widget (1 col) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">So'nggi Harakatlar</h2>
            <p className="text-xs text-muted-foreground">Oxirgi amalga oshirilgan operasiyalar</p>
          </div>

          <div className="space-y-3">
            {MOCK_ACTIVITIES.map((act) => (
              <div key={act.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-2 hover:border-muted-foreground/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">{act.tovar_turi}</span>
                  <span className="text-[10px] text-muted-foreground">{act.created_at}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sof: <strong className="text-foreground">{act.net_weight} kg</strong></span>
                  <span className="text-muted-foreground">Manba: <strong className="text-foreground">{act.created_by}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
