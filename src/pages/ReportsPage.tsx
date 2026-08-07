import React, { useState } from "react";
import { Package, Truck, Plus, FileSpreadsheet, Search, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";

// Updated Data Structure: Primary identifier is code (kodi), names removed per user request
interface ReysItem {
  id: number;
  code: string; // e.g. "REYS-45"
  toza_kg: number;
  karobka_plus_kg: number;
  date: string;
}

interface CargoItem {
  id: number;
  code: string; // e.g. "KARGO-01"
  reys_count: number;
  total_toza_kg: number;
  total_karobka_plus_kg: number;
  reyslar: ReysItem[];
}

const MOCK_CARGOS: CargoItem[] = [
  {
    id: 1,
    code: "KARGO-01",
    reys_count: 5,
    total_toza_kg: 92400,
    total_karobka_plus_kg: 104500,
    reyslar: [
      { id: 101, code: "REYS-45", toza_kg: 18450, karobka_plus_kg: 20900, date: "2026-08-06" },
      { id: 102, code: "REYS-44", toza_kg: 19200, karobka_plus_kg: 21750, date: "2026-08-04" },
      { id: 103, code: "REYS-43", toza_kg: 17800, karobka_plus_kg: 20100, date: "2026-08-01" },
      { id: 104, code: "REYS-42", toza_kg: 18500, karobka_plus_kg: 21000, date: "2026-07-28" },
      { id: 105, code: "REYS-41", toza_kg: 18450, karobka_plus_kg: 20750, date: "2026-07-25" },
    ],
  },
  {
    id: 2,
    code: "KARGO-02",
    reys_count: 4,
    total_toza_kg: 74100,
    total_karobka_plus_kg: 83800,
    reyslar: [
      { id: 201, code: "REYS-12", toza_kg: 21000, karobka_plus_kg: 23700, date: "2026-08-05" },
      { id: 202, code: "REYS-11", toza_kg: 19500, karobka_plus_kg: 22100, date: "2026-08-02" },
      { id: 203, code: "REYS-10", toza_kg: 17800, karobka_plus_kg: 20100, date: "2026-07-29" },
      { id: 204, code: "REYS-09", toza_kg: 15800, karobka_plus_kg: 17900, date: "2026-07-24" },
    ],
  },
  {
    id: 3,
    code: "KARGO-03",
    reys_count: 3,
    total_toza_kg: 58900,
    total_karobka_plus_kg: 66400,
    reyslar: [
      { id: 301, code: "REYS-08", toza_kg: 22100, karobka_plus_kg: 24900, date: "2026-08-03" },
      { id: 302, code: "REYS-07", toza_kg: 19800, karobka_plus_kg: 22300, date: "2026-07-30" },
      { id: 303, code: "REYS-06", toza_kg: 17000, karobka_plus_kg: 19200, date: "2026-07-26" },
    ],
  },
];

export const ReportsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<"main" | "cargos" | "direct_reys">("main");
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCargoModal, setShowAddCargoModal] = useState(false);
  const [newCargoCode, setNewCargoCode] = useState("");

  // Search filter matching code
  const filteredCargos = MOCK_CARGOS.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allReys = MOCK_CARGOS.flatMap((c) => c.reyslar).filter((r) =>
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {activeView !== "main" && (
            <button
              onClick={() => {
                if (selectedCargo) {
                  setSelectedCargo(null);
                } else {
                  setActiveView("main");
                }
                setIsExpanded(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {activeView === "main" && "Hisobotlar Bo'limi"}
              {activeView === "cargos" && !selectedCargo && "Kargolar Hisoboti"}
              {activeView === "cargos" && selectedCargo && selectedCargo.code}
              {activeView === "direct_reys" && "Barcha Reyslar Hisoboti"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeView === "main" && "Hisobot turini tanlang"}
              {activeView === "cargos" && !selectedCargo && "Kargolar ro'yxati va umumiy tahlil"}
              {activeView === "cargos" && selectedCargo && `${selectedCargo.code} — Reyslar ro'yxati`}
              {activeView === "direct_reys" && "Barcha reyslar va yuk balansi"}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. MAIN CHOICE VIEW (2 CARDS)                                 */}
      {/* ------------------------------------------------------------- */}
      {activeView === "main" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          
          {/* Card 1: Kargolar Hisoboti */}
          <button
            onClick={() => setActiveView("cargos")}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-left shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-98 glass-panel"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7" />
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                {MOCK_CARGOS.length} ta Kargo
              </span>
            </div>
            <div className="mt-6 space-y-2">
              <h2 className="text-xl font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                Kargolar Hisoboti
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Kargolar kodi bo'yicha ro'yxat va reyslar tahlili.
              </p>
            </div>
          </button>

          {/* Card 2: Reyslar Hisoboti */}
          <button
            onClick={() => setActiveView("direct_reys")}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card p-8 text-left shadow-xl transition-all duration-300 hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10 active:scale-98 glass-panel"
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-teal-500/10 blur-2xl group-hover:bg-teal-500/20 transition-all" />
            <div className="flex items-center justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
                <Truck className="h-7 w-7" />
              </div>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 border border-teal-500/20">
                {allReys.length} ta Reys
              </span>
            </div>
            <div className="mt-6 space-y-2">
              <h2 className="text-xl font-bold text-foreground group-hover:text-teal-400 transition-colors">
                Reyslar Hisoboti
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Barcha reyslar kodi va vazn ko'rsatkichlari.
              </p>
            </div>
          </button>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. KARGOLAR LIST VIEW (Code focused, FAB + Button)            */}
      {/* ------------------------------------------------------------- */}
      {activeView === "cargos" && !selectedCargo && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kargo kodi bo'yicha qidirish..."
              className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Cargo Cards Grid — Focused solely on Cargo Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCargos.map((cargo) => (
              <div
                key={cargo.id}
                onClick={() => {
                  setSelectedCargo(cargo);
                  setIsExpanded(false);
                }}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-foreground group-hover:text-emerald-400 transition-colors tracking-wide">
                    {cargo.code}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
                    {cargo.reys_count} ta reys
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Toza:</span>
                    <strong className="text-foreground">{cargo.total_toza_kg.toLocaleString()} kg</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">karobka plus:</span>
                    <strong className="text-emerald-400">{cargo.total_karobka_plus_kg.toLocaleString()} kg</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAB (+) Add Cargo Floating Button */}
          <button
            onClick={() => setShowAddCargoModal(true)}
            className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
            title="Yangi Kargo Kodi Qo'shish"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. SELECTED CARGO REYSLAR VIEW (Code focused, Top 3 + Collapse) */}
      {/* ------------------------------------------------------------- */}
      {activeView === "cargos" && selectedCargo && (
        <div className="space-y-6">
          {/* Search Input for Reys Code */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Reys kodi bo'yicha qidirish..."
              className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Reyslar Grid List */}
          {(() => {
            const reysList = selectedCargo.reyslar.filter((r) =>
              r.code.toLowerCase().includes(searchQuery.toLowerCase())
            );
            const visibleReys = isExpanded ? reysList : reysList.slice(0, 3);
            const hasMore = reysList.length > 3;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {visibleReys.map((reys) => (
                    <ReysCard key={reys.id} reys={reys} />
                  ))}
                </div>

                {/* Collapse / Expand Toggle Button */}
                {hasMore && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="inline-flex items-center space-x-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      <span>
                        {isExpanded
                          ? "Yopish (Faqat 3 ta ko'rsatish)"
                          : `Qolgan ${reysList.length - 3} ta reysni ko'rsatish`}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-emerald-400" /> : <ChevronDown className="h-4 w-4 text-emerald-400" />}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. DIRECT REYSLAR VIEW (Code focused)                        */}
      {/* ------------------------------------------------------------- */}
      {activeView === "direct_reys" && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Reys kodi bo'yicha qidirish..."
              className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allReys.map((reys) => (
              <ReysCard key={reys.id} reys={reys} />
            ))}
          </div>
        </div>
      )}

      {/* Add Cargo Modal */}
      {showAddCargoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Yangi Kargo Kodi Qo'shish</h3>
            <input
              type="text"
              value={newCargoCode}
              onChange={(e) => setNewCargoCode(e.target.value)}
              placeholder="Kargo kodi (Masalan: KARGO-04)"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none uppercase font-bold tracking-wider"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAddCargoModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  if (newCargoCode.trim()) {
                    MOCK_CARGOS.push({
                      id: Date.now(),
                      code: newCargoCode.toUpperCase().trim(),
                      reys_count: 0,
                      total_toza_kg: 0,
                      total_karobka_plus_kg: 0,
                      reyslar: [],
                    });
                    setNewCargoCode("");
                    setShowAddCargoModal(false);
                  }
                }}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// -------------------------------------------------------------------
// REYS CARD COMPONENT BASED ON USER SPECIFIED WIREFRAME
// Main identifier: reys_kodi (Name removed per user request)
// ___________________________
// |            reys_kodi            |
// |___________________________|
// | Toza:               |        x kg |
// |  karobka plus |         x kg |
// |           Excel                        |
// _____________________________|
// -------------------------------------------------------------------
const ReysCard: React.FC<{ reys: ReysItem }> = ({ reys }) => {
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
