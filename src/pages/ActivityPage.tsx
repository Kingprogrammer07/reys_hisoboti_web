import React from "react";
import { MOCK_ACTIVITIES } from "../mock/data";
import { History, Filter, Camera, CheckCircle2, User, Clock, ArrowUpDown } from "lucide-react";

export const ActivityPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Faollik Jurnali</h1>
          <p className="text-sm text-muted-foreground">
            Barcha amallar, kiritilgan kirimlar va o'zgarishlar auditi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Qidirish (tovar, foydalanuvchi)..."
              className="rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/30 text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3.5">Vaqt</th>
              <th className="px-4 py-3.5">Tovar Turi</th>
              <th className="px-4 py-3.5 text-right">Og'irlik (kg)</th>
              <th className="px-4 py-3.5 text-right">Karobka og'irligi</th>
              <th className="px-4 py-3.5 text-right">Sof Vazn (kg)</th>
              <th className="px-4 py-3.5">Manba</th>
              <th className="px-4 py-3.5 text-center">Rasmlar</th>
              <th className="px-4 py-3.5 text-center">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_ACTIVITIES.map((act) => (
              <tr key={act.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{act.created_at}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-foreground">{act.tovar_turi}</td>
                <td className="px-4 py-3.5 text-right text-muted-foreground">{act.gross_weight}</td>
                <td className="px-4 py-3.5 text-right text-amber-400 font-medium">{act.coefficient} kg</td>
                <td className="px-4 py-3.5 text-right font-bold text-emerald-400">{act.net_weight} kg</td>
                <td className="px-4 py-3.5 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{act.created_by}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center space-x-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                    <Camera className="h-3 w-3" />
                    <span>{act.photos_count}</span>
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Tasdiqlangan</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
