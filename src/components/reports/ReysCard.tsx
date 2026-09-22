import React from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Edit2, Trash2, ChevronRight, MoreVertical, Sparkles, Scale } from "lucide-react";
import { ReysItem } from "../../types";

interface ReysCardProps {
  reys: ReysItem;
  onEdit?: (reys: ReysItem) => void;
  onDelete?: (reys: ReysItem) => void;
  onOptions?: (reys: ReysItem) => void;
}

// REYS CARD COMPONENT MATCHING USER WIREFRAME WITH 3-DOT OPTIONS
// ___________________________
// |            reys_kodi            |
// |___________________________|
// | Toza:               |        x kg |
// |  karobka plus |         x kg |
// |           Excel                        |
// _____________________________|
export const ReysCard: React.FC<ReysCardProps> = ({ reys, onEdit, onDelete, onOptions }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/reports/reys/${reys.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:border-emerald-500/50 hover:shadow-lg transition-all flex flex-col justify-between"
    >
      {/* Header: reys_kodi + Actions (Edit/Delete/3-Dot Options) */}
      <div className="border-b border-border/80 bg-muted/30 px-4 py-3 flex items-center justify-between">
        <div className="flex-1 text-center truncate">
          <h4 className="text-base font-extrabold text-foreground tracking-wide group-hover:text-emerald-400 transition-colors inline-flex items-center justify-center space-x-1">
            <span>{reys.code}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </h4>
          {/* Custom Special Name Display if exists */}
          {reys.custom_name && (
            <div className="flex items-center justify-center space-x-1 text-[11px] font-semibold text-emerald-400 truncate mt-0.5">
              <Sparkles className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{reys.custom_name}</span>
            </div>
          )}
        </div>

        {/* Action icons */}
        {(onEdit || onDelete || onOptions) && (
          <div className="flex items-center space-x-1 pl-2" onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <button
                onClick={() => onEdit(reys)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                title="Reys kodini o'zgartirish"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(reys)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                title="Reysni o'chirish"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            {/* Vertical 3-Dot Options Button */}
            {onOptions && (
              <button
                onClick={() => onOptions(reys)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                title="Maxsus nom va og'irlikni moslash"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body: Toza & karobka plus */}
      <div className="p-4 space-y-2 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-border/40">
          <span className="text-muted-foreground">Toza:</span>
          <div className="text-right">
            <span className="font-bold text-foreground">{reys.toza_kg.toLocaleString()} kg</span>
            {reys.adjustment_diff_kg !== undefined && reys.adjustment_diff_kg !== 0 && (
              <span className={`block text-[10px] font-semibold ${reys.adjustment_diff_kg > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({reys.adjustment_diff_kg > 0 ? '+' : ''}{reys.adjustment_diff_kg.toLocaleString()} kg moslangan)
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-muted-foreground">karobka plus:</span>
          <span className="font-bold text-emerald-400">{reys.karobka_plus_kg.toLocaleString()} kg</span>
        </div>
      </div>

      {/* Footer: Excel Button */}
      <div className="p-3 border-t border-border/80 bg-muted/10 text-center" onClick={(e) => e.stopPropagation()}>
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
