import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertTriangle, X, Trash2, RotateCcw, Clock, Filter, Sparkles, Scale, Check, Undo2, FileSpreadsheet, Calendar } from "lucide-react";
import { ReysCard } from "../../components/reports/ReysCard";
import { ReysItem } from "../../types";
import {
  fetchReyslar,
  createReys,
  updateReys,
  deleteReys,
  restoreReys,
  adjustReys,
  fetchBinItems,
  downloadFile,
} from "../../api";

interface RecycledReysItem extends ReysItem {
  deletedAt: string;
  daysRemaining: number;
}

// ROUTE: /reports/reys
export const ReysListPage: React.FC = () => {
  // Active Reys List
  const [reysList, setReysList] = useState<ReysItem[]>(() => {
    try {
      const cached = sessionStorage.getItem("reyslar_cache");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => !sessionStorage.getItem("reyslar_cache"));

  // Recycle Bin (Savatcha) State
  const [recycledList, setRecycledList] = useState<RecycledReysItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [binSearchQuery, setBinSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecycleBinModal, setShowRecycleBinModal] = useState(false);
  const [newReysCode, setNewReysCode] = useState("");

  const [reysToEdit, setReysToEdit] = useState<ReysItem | null>(null);
  const [editReysCode, setEditReysCode] = useState("");

  const [reysToDelete, setReysToDelete] = useState<ReysItem | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState("");

  // 3-Dot Options Modal States (Maxsus nom & Yuk og'irligini moslash)
  const [reysForOptions, setReysForOptions] = useState<ReysItem | null>(null);
  const [optionsActiveTab, setOptionsActiveTab] = useState<"customName" | "adjustWeight">("customName");
  const [customNameInput, setCustomNameInput] = useState("");
  const [targetWeightInput, setTargetWeightInput] = useState("");

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "week" | "month">("all");

  // Search and Date filter active reys
  const filteredReys = reysList.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.custom_name && r.custom_name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (dateFilter === "all" || !r.date) return true;
    const reysDate = new Date(r.date);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (dateFilter === "today") return r.date === todayStr;
    if (dateFilter === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return r.date === y.toISOString().split("T")[0];
    }
    if (dateFilter === "week") {
      const diffDays = (now.getTime() - reysDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    if (dateFilter === "month") {
      const diffDays = (now.getTime() - reysDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }
    return true;
  });

  // Search filter recycled reys inside modal
  const filteredRecycledList = recycledList.filter((r) =>
    r.code.toLowerCase().includes(binSearchQuery.toLowerCase()) ||
    r.deletedAt.includes(binSearchQuery)
  );

  // Pagination & Collapse logic
  const totalPages = Math.ceil(filteredReys.length / ITEMS_PER_PAGE) || 1;
  const paginatedReys = filteredReys.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const visibleReys = isExpanded ? paginatedReys : filteredReys.slice(0, 3);
  const hasMore = filteredReys.length > 3;

  // Load Reyslar and Recycle Bin from API on mount
  useEffect(() => {
    loadReyslar();
    loadBinItems();
  }, []);

  const loadReyslar = async () => {
    try {
      const res = await fetchReyslar();
      if (res && Array.isArray(res.items)) {
        setReysList(res.items);
        sessionStorage.setItem("reyslar_cache", JSON.stringify(res.items));
      }
    } catch (err) {
      console.warn("Could not load reyslar from API", err);
    } finally {
      setLoading(false);
    }
  };

  const loadBinItems = async () => {
    try {
      const res = await fetchBinItems();
      if (res && Array.isArray(res.items)) {
        const reysBinItems: RecycledReysItem[] = res.items
          .filter((i: any) => i.entity_type === "reys")
          .map((i: any) => ({
            id: i.entity_id,
            code: i.title.replace(/^Reys:\s*/i, ""),
            toza_kg: 0,
            karobka_plus_kg: 0,
            date: new Date().toISOString().split("T")[0],
            deletedAt: new Date(i.deleted_at * 1000).toISOString().split("T")[0],
            daysRemaining: i.days_remaining,
          }));
        setRecycledList(reysBinItems);
      }
    } catch (err) {
      console.warn("Could not load bin items from API", err);
    }
  };

  // Open 3-Dot Options Modal
  const handleOpenOptions = (reys: ReysItem) => {
    setReysForOptions(reys);
    setCustomNameInput(reys.custom_name || "");
    setTargetWeightInput(String(reys.toza_kg));
    setOptionsActiveTab("customName");
  };

  // Save Custom Reys Name
  const handleSaveCustomName = async () => {
    if (reysForOptions) {
      const customName = customNameInput.trim() || undefined;
      try {
        await updateReys(reysForOptions.id, { custom_name: customName });
      } catch (err) {
        alert(`Reys nomi saqlanmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setReysList(
        reysList.map((r) =>
          r.id === reysForOptions.id
            ? { ...r, custom_name: customName }
            : r
        )
      );
      setReysForOptions(null);
    }
  };

  // Apply Weight Adjustment (Yuk og'irligini moslash)
  const handleApplyWeightAdjustment = async () => {
    if (reysForOptions && targetWeightInput) {
      const targetWeight = Number(targetWeightInput);
      if (!isNaN(targetWeight) && targetWeight >= 0) {
        const originalToza = reysForOptions.original_toza_kg ?? reysForOptions.toza_kg;
        const originalKarobka = reysForOptions.original_karobka_plus_kg ?? reysForOptions.karobka_plus_kg;
        const diff = targetWeight - reysForOptions.toza_kg;
        const newKarobka = Math.max(0, reysForOptions.karobka_plus_kg + diff);

        try {
          const adjusted = await adjustReys(reysForOptions.id, targetWeight, newKarobka);
          setReysList(reysList.map((r) => (r.id === reysForOptions.id ? adjusted : r)));
        } catch (err) {
          alert(`Vazn moslanmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
          return;
        }
        setReysForOptions(null);
      }
    }
  };

  // Revert / Rollback Weight Adjustment (Asliga / Orqaga qaytarish)
  const handleRevertWeightAdjustment = async () => {
    if (reysForOptions && reysForOptions.original_toza_kg !== undefined) {
      const origToza = reysForOptions.original_toza_kg;
      const origKarobka = reysForOptions.original_karobka_plus_kg ?? 0;
      try {
        const adjusted = await adjustReys(reysForOptions.id, origToza, origKarobka);
        setReysList(reysList.map((r) => (r.id === reysForOptions.id ? adjusted : r)));
      } catch (err) {
        alert(`Vazn asliga qaytarilmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setReysForOptions(null);
    }
  };

  // Add Handler — ONLY REYS CODE IS ENTERED
  const handleAddReys = async () => {
    if (newReysCode.trim()) {
      const code = newReysCode.toUpperCase().trim();
      const date = new Date().toISOString().split("T")[0];
      try {
        const created = await createReys({ code, date });
        setReysList([created, ...reysList]);
      } catch (err) {
        alert(`Reys saqlanmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setNewReysCode("");
      setShowAddModal(false);
    }
  };

  // Edit Handler — REYS CODE ONLY
  const handleEditReys = async () => {
    if (reysToEdit && editReysCode.trim()) {
      const code = editReysCode.toUpperCase().trim();
      try {
        const updated = await updateReys(reysToEdit.id, { code });
        setReysList(reysList.map((r) => (r.id === reysToEdit.id ? updated : r)));
      } catch (err) {
        alert(`Reys o'zgartirilmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setReysToEdit(null);
    }
  };

  // Soft Delete Handler
  const handleSoftDeleteReys = async () => {
    if (reysToDelete && confirmDeleteInput.trim().toUpperCase() === reysToDelete.code) {
      try {
        await deleteReys(reysToDelete.id);
        await loadReyslar();
        await loadBinItems();
      } catch (err) {
        alert(`Reys savatchaga o'tkazilmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setReysToDelete(null);
      setConfirmDeleteInput("");
    }
  };

  // Restore Handler
  const handleRestoreReys = async (id: number) => {
    try {
      await restoreReys(id);
      await loadReyslar();
      await loadBinItems();
    } catch (err) {
      alert(`Reys tiklanmadi: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
    }
  };

  // Hard Delete Handler
  const handleHardDeleteReys = (id: number) => {
    setRecycledList(recycledList.filter((r) => r.id !== id));
  };

  // Live Difference calculation for weight adjustment modal
  const liveTargetWeight = Number(targetWeightInput) || 0;
  const currentWeight = reysForOptions ? reysForOptions.toza_kg : 0;
  const liveWeightDiff = liveTargetWeight - currentWeight;

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-12 max-w-5xl mx-auto px-2 sm:px-4">
      
      {/* Top Header (Compact & 320px Responsive) */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link
            to="/reports"
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0"
            title="Ortga qaytish"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
              Barcha Reyslar Hisoboti
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Reyslar ro'yxati va monitoring
            </p>
          </div>
        </div>

        {/* Actions: Excel & Savatcha */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={async () => {
              try {
                await downloadFile(`/api/export/summary`, `BARCHA_REYSLAR_HISOBOTI.xlsx`);
              } catch (err: any) {
                alert(`Excel yuklab olishda xatolik: ${err?.message || "Xatolik yuz berdi"}`);
              }
            }}
            className="flex items-center space-x-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-teal-400 hover:bg-teal-500 hover:text-white transition-all shadow-xs shrink-0"
            title="Barcha reyslar Excel hisobotini yuklab olish"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Excel</span>
          </button>

          {/* Recycle Bin (Savatcha) Button */}
          <button
            type="button"
            onClick={() => setShowRecycleBinModal(true)}
            className="flex items-center space-x-1.5 rounded-xl border border-border bg-card px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-muted-foreground hover:text-amber-400 hover:border-amber-500/30 transition-all shadow-xs shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden xs:inline">Savatcha</span>
            <span className="font-mono font-bold">({recycledList.length})</span>
          </button>
        </div>
      </div>

      {/* Date Filter Shortcuts Toolbar */}
      <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 overflow-x-auto scrollbar-none">
        {[
          { id: "all", label: "Barchasi" },
          { id: "today", label: "Bugun" },
          { id: "yesterday", label: "Kecha" },
          { id: "week", label: "Shu hafta" },
          { id: "month", label: "Shu oy" },
        ].map((df) => (
          <button
            key={df.id}
            type="button"
            onClick={() => {
              setDateFilter(df.id as any);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              dateFilter === df.id
                ? "bg-card text-teal-400 shadow-sm border border-teal-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {df.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Reys kodi yoki maxsus nomi bo'yicha qidirish..."
          className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Reys Cards Grid */}
      <div className="space-y-6">
        {loading && reysList.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
            <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Reyslar ro'yxati yuklanmoqda...
          </div>
        ) : filteredReys.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-3xl space-y-3">
            <Scale className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <h3 className="text-base font-semibold text-foreground">
              {searchQuery ? "Reys topilmadi" : "Hozircha hech qanday reys mavjud emas"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `"${searchQuery}" bo'yicha hech qanday reys topilmadi.`
                : "Yangi reys yaratish uchun quyidagi tugmani bosing."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white font-semibold text-xs shadow-md hover:bg-teal-600 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Yangi Reys Qo'shish</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {visibleReys.map((reys) => (
              <ReysCard
                key={reys.id}
                reys={reys}
                onEdit={(r) => {
                  setReysToEdit(r);
                  setEditReysCode(r.code);
                }}
                onDelete={(r) => {
                  setReysToDelete(r);
                  setConfirmDeleteInput("");
                }}
                onOptions={(r) => handleOpenOptions(r)}
              />
            ))}
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        {hasMore && (
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                setCurrentPage(1);
              }}
              className="inline-flex items-center space-x-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
            >
              <span>
                {isExpanded
                  ? "Yopish (Faqat 3 ta ko'rsatish)"
                  : `Qolgan ${filteredReys.length - 3} ta reysni ko'rsatish`}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-emerald-400" />
              )}
            </button>
          </div>
        )}

        {/* Pagination Bar */}
        {isExpanded && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
            <span className="text-muted-foreground">
              Sahifa <strong className="text-foreground">{currentPage}</strong> / {totalPages} (Jami {filteredReys.length} ta reys)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FAB (+) Add Reys Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white shadow-2xl shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all"
        title="Yangi Reys Kodi Qo'shish"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* 1. 3-DOT OPTIONS MODAL: Maxsus Reys Nomi & Yuk Og'irligini Moslash */}
      {reysForOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-5 glass-panel">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2.5 text-amber-400">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{reysForOptions.code} — Qo'shimcha Sozlamalar</h3>
                  <p className="text-xs text-muted-foreground">Maxsus nom berish va yuk og'irligini moslash</p>
                </div>
              </div>
              <button onClick={() => setReysForOptions(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Selection Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-background/60 p-1 rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setOptionsActiveTab("customName")}
                className={`flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-xl transition-all ${
                  optionsActiveTab === "customName"
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Maxsus reys nomi</span>
              </button>

              <button
                type="button"
                onClick={() => setOptionsActiveTab("adjustWeight")}
                className={`flex items-center justify-center space-x-2 py-2 text-xs font-bold rounded-xl transition-all ${
                  optionsActiveTab === "adjustWeight"
                    ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>Yuk og'irligini moslash</span>
              </button>
            </div>

            {/* TAB 1 CONTENT: Maxsus reys nomini kiritish */}
            {optionsActiveTab === "customName" && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Maxsus reys nomini kiriting:
                  </label>
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder="Masalan: Dubay Premium Partiya 2"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Ushbu nom reys kartochkasida ko'rinadi va qidiruvda topiladi.
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setReysForOptions(null)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomName}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2 CONTENT: Yuk og'irligini moslash (Current vs Target vs Difference & Rollback) */}
            {optionsActiveTab === "adjustWeight" && (
              <div className="space-y-4 pt-1">
                
                {/* Current Weight Breakdown Display */}
                <div className="grid grid-cols-2 gap-3 bg-background/60 p-3 rounded-2xl border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Mavjud Toza vazn:</span>
                    <strong className="text-foreground text-sm font-mono">{currentWeight.toLocaleString()} kg</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Mavjud karobka plus:</span>
                    <strong className="text-teal-400 text-sm font-mono">{reysForOptions.karobka_plus_kg.toLocaleString()} kg</strong>
                  </div>
                </div>

                {/* Target Weight Prompt Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Necha kg ga moslash kerak? (Yangi Toza vazn):
                  </label>
                  <input
                    type="number"
                    value={targetWeightInput}
                    onChange={(e) => setTargetWeightInput(e.target.value)}
                    placeholder="Masalan: 18000"
                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none font-mono font-bold"
                    autoFocus
                  />
                </div>

                {/* Live Difference Display (Farq: Mavjud - Kiritilgan) */}
                <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mavjud og'irlik:</span>
                    <strong className="text-foreground font-mono">{currentWeight.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Kiritilgan og'irlik:</span>
                    <strong className="text-foreground font-mono">{liveTargetWeight.toLocaleString()} kg</strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-teal-500/20 text-sm font-bold">
                    <span className="text-foreground">Hisoblangan farq:</span>
                    <span className={`font-mono ${liveWeightDiff >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {liveWeightDiff >= 0 ? `+${liveWeightDiff.toLocaleString()}` : liveWeightDiff.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                {/* Rollback Notification if already adjusted */}
                {reysForOptions.original_toza_kg !== undefined && (
                  <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-400">
                    <span>Avvalgi asl vazn: {reysForOptions.original_toza_kg.toLocaleString()} kg</span>
                    <button
                      type="button"
                      onClick={handleRevertWeightAdjustment}
                      className="inline-flex items-center space-x-1 text-xs font-bold underline hover:text-amber-300"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      <span>Asliga qaytarish</span>
                    </button>
                  </div>
                )}

                {/* Modal Action Buttons */}
                <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setReysForOptions(null)}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyWeightAdjustment}
                    disabled={!targetWeightInput}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-teal-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Tasdiqlash va qo'llash</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 2. ADD REYS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Yangi Reys Kodi Qo'shish</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Reys kodi (Masalan: REYS-46):</label>
              <input
                type="text"
                value={newReysCode}
                onChange={(e) => setNewReysCode(e.target.value)}
                placeholder="REYS-46"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none uppercase font-bold tracking-wider"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAddReys}
                className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-600"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT REYS MODAL */}
      {reysToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Reys Kodini O'zgartirish</h3>
              <button onClick={() => setReysToEdit(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Yangi reys kodini kiriting:</label>
              <input
                type="text"
                value={editReysCode}
                onChange={(e) => setEditReysCode(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none uppercase font-bold tracking-wider"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setReysToEdit(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleEditReys}
                className="rounded-xl bg-teal-500 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-600"
              >
                O'zgartirishni saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SAFE DELETE REYS MODAL */}
      {reysToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Reysni Savatchaga O'tkazish</h3>
                <p className="text-xs text-muted-foreground">Savatchada 30 kun saqlanadi</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-muted/30 p-3 border border-border text-xs text-muted-foreground">
              <p>
                Tasdiqlash uchun quyidagi katakka ushbu reys kodini aynan yozing:{" "}
                <strong className="text-foreground font-mono font-bold">{reysToDelete.code}</strong>
              </p>
              <p className="text-[11px] text-amber-400/90">
                ⚠️ Reys o'chirilganda kargo ichidagi aynan ushbu 1 ta reys ham savatchaga o'tadi.
              </p>
              <input
                type="text"
                value={confirmDeleteInput}
                onChange={(e) => setConfirmDeleteInput(e.target.value)}
                placeholder={reysToDelete.code}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-rose-500 focus:outline-none uppercase font-bold tracking-wider"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setReysToDelete(null);
                  setConfirmDeleteInput("");
                }}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSoftDeleteReys}
                disabled={confirmDeleteInput.trim().toUpperCase() !== reysToDelete.code}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
            
            <div className="flex items-start sm:items-center justify-between border-b border-border pb-2.5 sm:pb-3 gap-2">
              <div className="flex items-center space-x-2 text-amber-400 min-w-0">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-foreground truncate">Reyslar Savatchasi</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">30 kunlik saqlash va Admin qayta tiklash paneli</p>
                </div>
              </div>
              <button onClick={() => setShowRecycleBinModal(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={binSearchQuery}
                onChange={(e) => setBinSearchQuery(e.target.value)}
                placeholder="Reys kodi yoki sana bo'yicha..."
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="text-[10px] sm:text-xs text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 sm:p-3 flex items-start space-x-2">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-tight">O'chirilgan reyslar 30 kun saqlanadi. Admin "Tiklash" tugmasi orqali reysni qaytarishi mumkin.</span>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pr-0.5">
              {filteredRecycledList.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Savatcha bo'sh yoki qidiruvga mos reys topilmadi.
                </div>
              ) : (
                filteredRecycledList.map((item) => (
                  <div key={item.id} className="p-2.5 sm:p-3 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-extrabold text-foreground font-mono text-sm sm:text-base">{item.code}</span>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md text-amber-400 font-medium">
                          ⏳ {item.daysRemaining} kun qoldi
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px] sm:text-[11px] flex items-center flex-wrap gap-x-2.5 gap-y-0.5">
                        <span>O'chirilgan: <strong className="text-foreground/80">{item.deletedAt}</strong></span>
                        <span>Toza: <strong className="text-emerald-400">{item.toza_kg.toLocaleString()} kg</strong></span>
                        <span>Karobka+: <strong className="text-foreground/80">{item.karobka_plus_kg.toLocaleString()} kg</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-1.5 shrink-0 pt-1.5 sm:pt-0 border-t border-border/40 sm:border-0">
                      <button
                        onClick={() => handleRestoreReys(item.id)}
                        className="inline-flex items-center space-x-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Tiklash</span>
                      </button>
                      <button
                        onClick={() => handleHardDeleteReys(item.id)}
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
