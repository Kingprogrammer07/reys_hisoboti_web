import React from "react";
import { FileSpreadsheet } from "lucide-react";
import { ReysItem } from "../../types";

// REYS CARD COMPONENT MATCHING USER WIREFRAME
// ___________________________
// |            reys_kodi            |
// |___________________________|
// | Toza:               |        x kg |
// |  karobka plus |         x kg |
// |           Excel                        |
// _____________________________|
export const ReysCard: React.FC<{ reys: ReysItem }> = ({ reys }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between">
      {/* Header: reys_kodi */}
      <div className="border-b border-border/80 bg-muted/30 px-4 py-3 text-center">
        <h4 className="text-base font-extrabold text-foreground tracking-wide">{reys.code}</h4>
      </div>

      {/* Body: Toza & karobka plus */}
      <div className="p-4 space-y-2 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-border/40">
          <span className="text-muted-foreground">Toza:</span>
          <span className="font-bold text-foreground">{reys.toza_kg.toLocaleString()} kg</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">karobka plus:</span>
          <span className="font-bold text-emerald-400">{reys.karobka_plus_kg.toLocaleString()} kg</span>
        </div>
      </div>

      {/* Footer: Excel Button */}
      <div className="p-3 border-t border-border/80 bg-muted/10 text-center">
        <button
          onClick={() => alert(`${reys.code} uchun Excel hisoboti yuklab olinmoqda...`)}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-98"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Excel</span>
        </button>
      </div>
    </div>
  );
};
