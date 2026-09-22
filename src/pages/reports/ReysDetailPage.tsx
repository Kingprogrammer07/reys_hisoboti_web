import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Scale, Truck, FileSpreadsheet, X, ChevronRight, ListOrdered } from "lucide-react";
import { MOCK_CARGOS } from "../../mock/data";

// ROUTE: /reports/reys/:reysId
export const ReysDetailPage: React.FC = () => {
  const { reysId } = useParams<{ reysId: string }>();
  const navigate = useNavigate();

  // Find Reys details from mock data
  const allReys = MOCK_CARGOS.flatMap((c) => c.reyslar);
  const reys = allReys.find((r) => r.id === Number(reysId)) || allReys[0];

  // Modal State for Obshiy ves
  const [showObshiyVesModal, setShowObshiyVesModal] = useState(false);

  // The 5 Category Buttons for Obshiy ves Modal, each with an Excel export button
  const obshiyVesCategories = [
    { id: "top", label: "TOP" },
    { id: "top_dan_chiqgan", label: "TOP'dan chiqgan" },
    { id: "bizdan_chiqgan", label: "Bizdan chiqgan" },
    { id: "bizda_qoladigan", label: "Bizda qoladigan" },
    { id: "umumiy_hisobot", label: "Umumiy hisobot" },
  ];

  // Helper to get count of saved entries for each category
  const getCategoryStats = (catId: string) => {
    try {
      const stored = localStorage.getItem(`mandarin_entries_${reys.id}_${catId}`);
      if (stored) {
        const items = JSON.parse(stored);
        if (Array.isArray(items)) {
          const totalWeight = items.reduce((sum: number, item: any) => sum + (Number(item.netWeight) || 0), 0);
          return { count: items.length, weight: totalWeight };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return catId === "top" ? { count: 2, weight: 37.46 } : { count: 0, weight: 0 };
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-12 max-w-5xl mx-auto px-2 sm:px-4">
      
      {/* Top Header (Compact & 320px Responsive) */}
      <div className="flex items-center space-x-2.5 pt-1">
        <Link
          to="/reports/reys"
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0"
          title="Reyslar ro'yxatiga qaytish"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center space-x-2 truncate">
            <span>{reys.code}</span>
            {reys.custom_name && (
              <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                {reys.custom_name}
              </span>
            )}
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Reys tahlili va tarqatish xulosasi</p>
        </div>
      </div>


      {/* THE 2 CLEAN MINIMAL CARDS AS REQUESTED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* CARD 1: OBSHIY VES (Clicking opens 5-button Modal) */}
        <div
          onClick={() => setShowObshiyVesModal(true)}
          className="group cursor-pointer relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-left shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-98 glass-panel space-y-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Scale className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              5 ta toifa
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-foreground group-hover:text-emerald-400 transition-colors">
              Obshiy ves
            </h2>
            <p className="text-xs text-muted-foreground">
              Bosganda toifalar va kiritilgan karobkalar ochiladi
            </p>
          </div>

          {/* Dedicated Excel Button */}
          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowObshiyVesModal(true)}
              className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 py-3 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-98"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* CARD 2: KARGOLARGA TARQATISH */}
        <div
          onClick={() => alert(`${reys.code} — Kargolarga tarqatish tanlandi`)}
          className="group cursor-pointer relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-left shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 active:scale-98 glass-panel space-y-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
              <Truck className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20">
              Kargolar tarqatish
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-foreground group-hover:text-teal-400 transition-colors">
              Kargolarga tarqatish
            </h2>
            <p className="text-xs text-muted-foreground">
              Ushbu reysdan kargolar bo'yicha tarqatilgan yuklar
            </p>
          </div>

          {/* Dedicated Excel Button */}
          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => alert(`${reys.code} — Kargolarga tarqatish Excel hisoboti yuklab olinmoqda...`)}
              className="w-full flex items-center justify-center space-x-2 rounded-2xl bg-teal-500/10 border border-teal-500/20 py-3 text-xs font-bold text-teal-400 hover:bg-teal-500 hover:text-white transition-all shadow-sm active:scale-98"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel</span>
            </button>
          </div>
        </div>

      </div>

      {/* OBSHIY VES MODAL WITH THE 5 CATEGORY ROWS LEADING TO FORM & DISPLAYING UPLOAD STATS */}
      {showObshiyVesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-6 glass-panel">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Scale className="h-6 w-6" />
                <div>
                  <h3 className="text-xl font-bold text-foreground">Obshiy ves — {reys.code}</h3>
                  <p className="text-xs text-muted-foreground">Toifani tanlang — kiritish formasi va ro'yxat ochiladi</p>
                </div>
              </div>
              <button onClick={() => setShowObshiyVesModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 5 CATEGORY BUTTONS WITH UPLOADED ITEM STATS AND EXCEL BUTTONS */}
            <div className="space-y-3">
              {obshiyVesCategories.map((cat, idx) => {
                const stats = getCategoryStats(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => navigate(`/reports/reys/${reys.id}/entry/${cat.id}`)}
                    className="group cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border border-border bg-background/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 group-hover:scale-105 transition-transform font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-extrabold text-foreground tracking-wide group-hover:text-emerald-400 transition-colors flex items-center space-x-1">
                          <span>{cat.label}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        </span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          {stats.count > 0 ? (
                            <span className="text-[11px] font-semibold text-emerald-400 font-mono">
                              ✓ {stats.count} ta karobka ({stats.weight.toFixed(2)} kg toza)
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Hozircha bo'sh — kiritish uchun bosing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Excel Button for each category */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => alert(`${reys.code} — ${cat.label} Excel hisoboti yuklab olinmoqda...`)}
                        className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Excel</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-border pt-3">
              <button
                onClick={() => setShowObshiyVesModal(false)}
                className="rounded-xl border border-border px-5 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Yopish
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
