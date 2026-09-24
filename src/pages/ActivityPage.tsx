import React, { useEffect, useState } from "react";
import { dashboardApi, ActivityItem } from "../api";
import { Filter, Camera, CheckCircle2, User, Clock, RefreshCw, Inbox } from "lucide-react";

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getActivities(200);
      setActivities(data || []);
    } catch (err) {
      console.warn("Faollik jurnalini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = activities.filter((act) => {
    const q = searchQuery.toLowerCase();
    return (
      act.tovar_turi.toLowerCase().includes(q) ||
      act.created_by.toLowerCase().includes(q) ||
      (act.box_code && act.box_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Faollik Jurnali</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Barcha kiritilgan partiyalar va o'zgarishlar auditi
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidirish (tovar, karobka)..."
              className="w-full rounded-xl border border-input bg-card pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs sm:text-sm">
            <thead className="border-b border-border bg-muted/30 text-[11px] sm:text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5">Vaqt</th>
                <th className="px-4 py-3.5">Karobka</th>
                <th className="px-4 py-3.5">Tovar Turi</th>
                <th className="px-4 py-3.5 text-right">Og'irlik (kg)</th>
                <th className="px-4 py-3.5 text-right">Karobka og'irligi</th>
                <th className="px-4 py-3.5 text-right">Sof Vazn (kg)</th>
                <th className="px-4 py-3.5">Kirituvchi</th>
                <th className="px-4 py-3.5 text-center">Rasmlar</th>
                <th className="px-4 py-3.5 text-center">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && activities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    Ma'lumotlar yuklanmoqda...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    {searchQuery ? "Qidiruv bo'yicha hech narsa topilmadi." : "Hozircha faollik jurnali bo'sh."}
                  </td>
                </tr>
              ) : (
                filtered.map((act) => (
                  <tr key={act.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{act.created_at}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground whitespace-nowrap">
                      #{act.box_code}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">{act.tovar_turi}</td>
                    <td className="px-4 py-3.5 text-right text-muted-foreground whitespace-nowrap">{act.gross_weight}</td>
                    <td className="px-4 py-3.5 text-right text-amber-400 font-medium whitespace-nowrap">{act.coefficient} kg</td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400 whitespace-nowrap">{act.net_weight} kg</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <User className="h-3.5 w-3.5" />
                        <span>{act.created_by}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                        <Camera className="h-3 w-3" />
                        <span>{act.photos_count}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Tasdiqlangan</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
