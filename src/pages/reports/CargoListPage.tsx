import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Plus, ArrowLeft, Edit2, Trash2, AlertTriangle, X, ChevronRight, RotateCcw, Clock, Filter, FileSpreadsheet, Calendar, Package, RefreshCw } from "lucide-react";
import { CargoItem } from "../../types";
import {
  fetchCargos,
  createCargo,
  updateCargo,
  deleteCargo,
  restoreCargo,
  fetchBinItems,
  restoreBinItem,
  downloadFile,
} from "../../api";

interface RecycledCargoItem extends CargoItem {
  deletedAt: string;
  daysRemaining: number;
  originalReyslar: CargoItem["reyslar"];
}

const formatDate = (d: Date) => d.toISOString().split("T")[0];

// ROUTE: /reports/cargos
export const CargoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [cargoList, setCargoList] = useState<CargoItem[]>(() => {
    try {
      const cached = sessionStorage.getItem("cargos_cache");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => !sessionStorage.getItem("cargos_cache"));

  // Recycle Bin State
  const [recycledCargos, setRecycledCargos] = useState<RecycledCargoItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [binSearchQuery, setBinSearchQuery] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [showExcelDateModal, setShowExcelDateModal] = useState(false);

  // Date Range State for Excel Export
  const todayStr = formatDate(new Date());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDate(d);
  });
  const [endDate, setEndDate] = useState(todayStr);
  const [activeDateShortcut, setActiveDateShortcut] = useState<"today" | "yesterday" | "week" | "month" | "custom">("week");

  const [newCargoCode, setNewCargoCode] = useState("");

  const [cargoToEdit, setCargoToEdit] = useState<CargoItem | null>(null);
  const [editCargoCode, setEditCargoCode] = useState("");

  const [cargoToDelete, setCargoToDelete] = useState<CargoItem | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");

  // Filter Active Cargos
  const filteredCargos = cargoList.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter Recycled Cargos inside Recycle Bin
  const filteredRecycledCargos = recycledCargos.filter((c) =>
    c.code.toLowerCase().includes(binSearchQuery.toLowerCase()) ||
    c.deletedAt.includes(binSearchQuery)
  );

  // Date Shortcut Handler
  const handleDateShortcut = (shortcut: "today" | "yesterday" | "week" | "month") => {
    setActiveDateShortcut(shortcut);
    const now = new Date();
    const nowStr = formatDate(now);

    if (shortcut === "today") {
      setStartDate(nowStr);
      setEndDate(nowStr);
    } else if (shortcut === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (shortcut === "week") {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(formatDate(w));
      setEndDate(nowStr);
    } else if (shortcut === "month") {
      const m = new Date();
      m.setDate(m.getDate() - 30);
      setStartDate(formatDate(m));
      setEndDate(nowStr);
    }
  };

  // Load Cargos and Recycle Bin from API on mount
  useEffect(() => {
    loadCargos();
    loadBinItems();
  }, []);

  const loadCargos = async () => {
    try {
      const res = await fetchCargos();
      if (res && Array.isArray(res.items)) {
        setCargoList(res.items);
        sessionStorage.setItem("cargos_cache", JSON.stringify(res.items));
      }
    } catch (err) {
      console.warn("Could not load cargos from API", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBinItems = async () => {
    try {
      const res = await fetchBinItems();
      if (res && Array.isArray(res.items)) {
        const cargoBinItems: RecycledCargoItem[] = res.items
          .filter((i: any) => i.entity_type === "cargo")
          .map((i: any) => ({
            id: i.entity_id,
            code: i.title.replace(/^Kargo:\s*/i, ""),
            reys_count: 0,
            total_toza_kg: 0,
            total_karobka_plus_kg: 0,
            reyslar: [],
            originalReyslar: [],
            deletedAt: new Date(i.deleted_at * 1000).toISOString().split("T")[0],
            daysRemaining: i.days_remaining,
          }));
        setRecycledCargos(cargoBinItems);
      }
    } catch (err) {
      console.warn("Could not load bin items from API", err);
    }
  };

  // Add Handler
  const handleAddCargo = async () => {
    if (newCargoCode.trim()) {
      const code = newCargoCode.toUpperCase().trim();
      try {
        const created = await createCargo(code);
        setCargoList([created, ...cargoList]);
      } catch (err: any) {
        alert(`Kargo saqlanmadi: ${err?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setNewCargoCode("");
      setShowAddModal(false);
    }
  };

  // Edit Handler
  const handleEditCargo = async () => {
    if (cargoToEdit && editCargoCode.trim()) {
      const code = editCargoCode.toUpperCase().trim();
      try {
        const updated = await updateCargo(cargoToEdit.id, code);
        setCargoList(cargoList.map((c) => (c.id === cargoToEdit.id ? updated : c)));
      } catch (err: any) {
        alert(`Kargo o'zgartirilmadi: ${err?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setCargoToEdit(null);
      setEditCargoCode("");
    }
  };

  // Soft Delete Handler -> Cargo deleted, reys inside preserved but entry data cleared
  const handleSoftDeleteCargo = async () => {
    if (cargoToDelete && confirmDeleteInput.trim().toUpperCase() === cargoToDelete.code) {
      try {
        await deleteCargo(cargoToDelete.id);
        await loadCargos();
        await loadBinItems();
      } catch (err: any) {
        alert(`Kargo savatchaga o'tkazilmadi: ${err?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setCargoToDelete(null);
      setConfirmDeleteInput("");
    }
  };

  // Restore Handler -> Cargo restored, reys entry data restored to original
  const handleRestoreCargo = async (id: number) => {
    try {
      await restoreCargo(id);
      await loadCargos();
      await loadBinItems();
    } catch (err: any) {
      alert(`Kargo tiklanmadi: ${err?.message || "Server bilan aloqa yo'q"}`);
    }
  };

  // Hard Delete Handler
  const handleHardDeleteCargo = (id: number) => {
    setRecycledCargos(recycledCargos.filter((c) => c.id !== id));
  };

  // Execute Excel Download with Date Range
  const handleDownloadExcelWithDate = async () => {
    try {
      await downloadFile(`/api/export/kargo?start=${startDate}&end=${endDate}`, `KARGOLAR_${startDate}_${endDate}.xlsx`);
    } catch (err: any) {
      alert(`Excel yuklab olishda xatolik: ${err?.message || "Xatolik yuz berdi"}`);
    } finally {
      setShowExcelDateModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Top Header with Excel Download & Recycle Bin Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
          <Link
            to="/reports"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">Kargolar Hisoboti</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Kargo ustiga bosing — reyslar ro'yxatiga o'tish uchun</p>
          </div>
        </div>

        {/* Action Buttons: Excel yuklash & Savatcha */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Excel Yuklash Button */}
          <button
            onClick={() => setShowExcelDateModal(true)}
            className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
            title="Sana bo'yicha Excel hisobot yuklash"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Excel yuklash</span>
          </button>

          {/* Recycle Bin (Savatcha) Button */}
          <button
            onClick={() => setShowRecycleBinModal(true)}
            className="flex items-center space-x-1.5 rounded-xl border border-border bg-card px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:text-amber-400 hover:border-amber-500/30 transition-all shadow-sm active:scale-95"
            title="O'chirilgan kargolar savatchasi"
          >
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
            <span>Savatcha ({recycledCargos.length})</span>
          </button>
        </div>
      </div>

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

      {/* Cargo List Grid */}
      {loading && cargoList.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Kargolar ro'yxati yuklanmoqda...
        </div>
      ) : filteredCargos.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-3xl space-y-3">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery ? "Kargo topilmadi" : "Hozircha hech qanday kargo mavjud emas"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `"${searchQuery}" kodi bo'yicha hech qanday kargo topilmadi.`
              : "Yangi kargo yaratish uchun quyidagi tugmani bosing."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/90 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Yangi Kargo Qo'shish</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCargos.map((cargo) => (
            <div
              key={cargo.id}
              onClick={() => navigate(`/reports/cargos/${cargo.id}`)}
              className="group cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-extrabold text-foreground group-hover:text-emerald-400 transition-colors tracking-wide flex items-center space-x-1">
                    <span>{cargo.code}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">
                    {cargo.reys_count} ta reys
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setCargoToEdit(cargo);
                      setEditCargoCode(cargo.code);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                    title="Kargo kodini o'zgartirish"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCargoToDelete(cargo);
                      setConfirmDeleteInput("");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/50 text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                    title="Kargoni o'chirish"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
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
      )}

      {/* FAB (+) Add Cargo Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-2xl shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all"
        title="Yangi Kargo Kodi Qo'shish"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 1. EXCEL DATE RANGE SELECTION MODAL */}
      {showExcelDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3.5 sm:p-6 shadow-2xl space-y-4 glass-panel max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-2.5 sm:pb-3 gap-2">
              <div className="flex items-center space-x-2 text-emerald-400 min-w-0">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">Excel Hisobot Yuklash</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Muddat oralig'ini tanlang</p>
                </div>
              </div>
              <button onClick={() => setShowExcelDateModal(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Quick Date Shortcuts (Tezkor tugmalar) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Tezkor tanlash:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { key: "today", label: "Bugun" },
                  { key: "yesterday", label: "Kecha" },
                  { key: "week", label: "1 haftalik" },
                  { key: "month", label: "1 oylik" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleDateShortcut(item.key as any)}
                    className={`rounded-xl py-1.5 sm:py-2 text-xs font-semibold transition-all border text-center ${
                      activeDateShortcut === item.key
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                        : "bg-background/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range Inputs (Dan - Gacha) */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Dan (Boshlanish):</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setActiveDateShortcut("custom");
                    }}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Gacha (Tugash):</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setActiveDateShortcut("custom");
                    }}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-2.5 sm:pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowExcelDateModal(false)}
                className="rounded-xl border border-border px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDownloadExcelWithDate}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Yuklab olish</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ADD CARGO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2.5 sm:p-4">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-foreground">Yangi Kargo Kodi Qo'shish</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              type="text"
              value={newCargoCode}
              onChange={(e) => setNewCargoCode(e.target.value)}
              placeholder="Kargo kodi (Masalan: KARGO-04)"
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:outline-none uppercase font-bold tracking-wider"
              autoFocus
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAddCargo}
                className="rounded-xl bg-emerald-500 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT CARGO MODAL */}
      {cargoToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2.5 sm:p-4">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-foreground">Kargo Kodini O'zgartirish</h3>
              <button onClick={() => setCargoToEdit(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Yangi kargo kodini kiriting:</label>
              <input
                type="text"
                value={editCargoCode}
                onChange={(e) => setEditCargoCode(e.target.value)}
                placeholder="Kargo kodi"
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:outline-none uppercase font-bold tracking-wider"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setCargoToEdit(null)}
                className="rounded-xl border border-border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleEditCargo}
                className="rounded-xl bg-emerald-500 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                O'zgartirishni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SAFE DELETE CARGO MODAL */}
      {cargoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2.5 sm:p-4">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl border border-rose-500/30 bg-card p-4 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3 text-rose-400">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">Kargoni Savatchaga O'tkazish</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Savatchada 30 kun saqlanadi</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-muted/30 p-2.5 sm:p-3 border border-border text-xs text-muted-foreground">
              <p>
                Tasdiqlash uchun quyidagi katakka ushbu kargo kodini aynan yozing:{" "}
                <strong className="text-foreground font-mono font-bold">{cargoToDelete.code}</strong>
              </p>
              <p className="text-[11px] text-amber-400/90 leading-tight">
                ⚠️ Kargo o'chirilganda reyslar o'chmaydi, reyslar ichidagi ma'lumotlar arxivlanadi/nollanadi. Tiklanganda to'liq qaytadi.
              </p>
              <input
                type="text"
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                placeholder={cargoToDelete.code}
                className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground focus:border-rose-500 focus:outline-none uppercase font-bold tracking-wider"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setCargoToDelete(null);
                  setConfirmDeleteInput("");
                }}
                className="rounded-xl border border-border px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSoftDeleteCargo}
                disabled={confirmDeleteInput.trim().toUpperCase() !== cargoToDelete.code}
                className="rounded-xl bg-rose-500 px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Savatchaga o'tkazish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LARGE SPACIOUS RECYCLE BIN (SAVATCHA) MODAL WITH SEARCH & FILTER */}
      {showRecycleBinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/10 bg-card p-3 sm:p-5 shadow-2xl space-y-3 sm:space-y-4 max-h-[90vh] flex flex-col glass-panel overflow-hidden">
            
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between border-b border-border pb-2.5 sm:pb-3 gap-2">
              <div className="flex items-center space-x-2 text-amber-400 min-w-0">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-foreground truncate">Kargolar Savatchasi</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">30 kunlik saqlash va Admin qayta tiklash paneli</p>
                </div>
              </div>
              <button onClick={() => setShowRecycleBinModal(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Filter / Search Bar inside Recycle Bin */}
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={binSearchQuery}
                onChange={(e) => setBinSearchQuery(e.target.value)}
                placeholder="Kargo kodi yoki sana bo'yicha..."
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Banner Notice */}
            <div className="text-[10px] sm:text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 sm:p-3 flex items-start space-x-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-tight">O'chirilgan kargolar va reys ma'lumotlari 30 kun saqlanadi. Admin "Tiklash" orqali ma'lumotlarni qaytarishi mumkin.</span>
            </div>

            {/* Items List */}
            <div className="overflow-y-auto flex-1 space-y-2 pr-0.5">
              {filteredRecycledCargos.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Savatcha bo'sh yoki qidiruvga mos kargo topilmadi.
                </div>
              ) : (
                filteredRecycledCargos.map((item) => (
                  <div key={item.id} className="p-2.5 sm:p-3 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-extrabold text-foreground font-mono text-sm sm:text-base">{item.code}</span>
                        <span className="text-[10px] bg-muted/80 border border-border px-1.5 py-0.5 rounded-md text-muted-foreground">
                          {item.reys_count} ta reys
                        </span>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-amber-400 font-medium">
                          ⏳ {item.daysRemaining} kun qoldi
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px] sm:text-[11px] flex items-center flex-wrap gap-x-2.5 gap-y-0.5">
                        <span>O'chirilgan: <strong className="text-foreground/80">{item.deletedAt}</strong></span>
                        {item.total_toza_kg ? (
                          <span>Toza: <strong className="text-emerald-400">{item.total_toza_kg.toLocaleString()} kg</strong></span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-1.5 shrink-0 pt-1.5 sm:pt-0 border-t border-border/40 sm:border-0">
                      <button
                        onClick={() => handleRestoreCargo(item.id)}
                        className="inline-flex items-center space-x-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Tiklash</span>
                      </button>
                      <button
                        onClick={() => handleHardDeleteCargo(item.id)}
                        className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                        title="Butunlay o'chirish"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-border pt-2 sm:pt-3">
              <button
                onClick={() => setShowRecycleBinModal(false)}
                className="w-full sm:w-auto rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors text-center"
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
