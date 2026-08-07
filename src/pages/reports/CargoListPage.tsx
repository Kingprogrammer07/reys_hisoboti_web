import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ArrowLeft } from "lucide-react";
import { MOCK_CARGOS } from "../../mock/data";

// ROUTE: /reports/cargos
export const CargoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCargoModal, setShowAddCargoModal] = useState(false);
  const [newCargoCode, setNewCargoCode] = useState("");

  const filteredCargos = MOCK_CARGOS.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Top Bar with Back Link */}
      <div className="flex items-center space-x-3">
        <Link
          to="/reports"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kargolar Hisoboti</h1>
          <p className="text-xs text-muted-foreground">Kargolar kodi ro'yxati (URL: /reports/cargos)</p>
        </div>
      </div>

      {/* Search Bar */}
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

      {/* Cargo List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCargos.map((cargo) => (
          <div
            key={cargo.id}
            onClick={() => navigate(`/reports/cargos/${cargo.id}`)}
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

      {/* Modal */}
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
