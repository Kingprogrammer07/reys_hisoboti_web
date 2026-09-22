import React from "react";
import { MOCK_REPORTS, MOCK_INVENTORY, MOCK_ACTIVITIES } from "../mock/data";
import { Truck, Scale, PackageCheck, ArrowUpRight, Plus, CheckCircle2, Clock } from "lucide-react";

export const DashboardPage: React.FC = () => {

  const activeReport = MOCK_REPORTS.find((r) => r.is_active) || MOCK_REPORTS[0];

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-8">


      {/* Metrics Cards (3 Balanced Business Metrics) */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
        {/* Metric 1 */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Umumiy Sof Vazn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {activeReport.total_net_weight.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">kg</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
            <span>Bugun +1,240 kg qo'shildi</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Kiritishlar Soni</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <PackageCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {activeReport.total_entries_count} <span className="text-xs font-normal text-muted-foreground">ta yozuv</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span>So'nggi yozuv 10 daqiqa oldin</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Faol Tovar Turlari</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-foreground">
              {MOCK_INVENTORY.length} <span className="text-xs font-normal text-muted-foreground">tur</span>
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            <span>Barcha balanslar ijobiy</span>
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
              <p className="text-[11px] sm:text-xs text-muted-foreground">Joriy zaxira</p>
            </div>
            <button className="inline-flex items-center space-x-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shrink-0">
              <Plus className="h-3.5 w-3.5" />
              <span>Yangi kirim</span>
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
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
                  {MOCK_INVENTORY.map((item) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity Side Widget (1 col) */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">So'nggi harakatlar</h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">Oxirgi operatsiyalar</p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {MOCK_ACTIVITIES.map((act) => (
              <div key={act.id} className="rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm space-y-1.5 sm:space-y-2 hover:border-muted-foreground/30 transition-colors">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-primary truncate">{act.tovar_turi}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{act.created_at}</span>
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
