import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Trash2, 
  RotateCcw, 
  Package, 
  Truck, 
  Box, 
  Clock, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Filter,
  Check,
  X
} from "lucide-react";
import { fetchBinItems, restoreBinItem, purgeExpired, BinItem } from "../../api/bin";

type TabType = "all" | "cargo" | "reys" | "entry";

export const RecycleBinPage: React.FC = () => {
  const [items, setItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetchBinItems();
      if (res && Array.isArray(res.items)) {
        setItems(res.items);
      }
    } catch (err) {
      console.warn("Savatcha ma'lumotlarini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Restore single item
  const handleRestore = async (item: BinItem) => {
    const key = `${item.entity_type}_${item.entity_id}`;
    setRestoringId(key);
    try {
      await restoreBinItem(item.entity_type, item.entity_id);
      setItems((prev) => prev.filter((i) => !(i.entity_type === item.entity_type && i.entity_id === item.entity_id)));
      showToast(`✓ ${item.title} muvaffaqiyatli tiklandi!`);
    } catch (err: any) {
      alert(`Tiklashda xatolik: ${err?.message || "Server bilan aloqa yo'q"}`);
    } finally {
      setRestoringId(null);
    }
  };

  // Purge expired items
  const handlePurge = async () => {
    try {
      setIsPurging(true);
      const res = await purgeExpired(30);
      setShowPurgeModal(false);
      await loadItems();
      showToast(`✓ ${res.purged_count} ta eskirgan yozuv butunlay tozalandi.`);
    } catch (err: any) {
      alert(`Tozalashda xatolik: ${err?.message || "Server bilan aloqa yo'q"}`);
    } finally {
      setIsPurging(false);
    }
  };

  // Tab counts
  const cargoCount = items.filter((i) => i.entity_type === "cargo").length;
  const reysCount = items.filter((i) => i.entity_type === "reys").length;
  const entryCount = items.filter((i) => i.entity_type === "entry").length;

  // Filter items by tab & search query
  const filteredItems = items.filter((item) => {
    if (activeTab !== "all" && item.entity_type !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDetails = item.details?.toLowerCase().includes(q) || false;
      return matchTitle || matchDetails;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto px-2 sm:px-4">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-2xl shadow-emerald-500/40 animate-in fade-in slide-in-from-top-3 duration-200 max-w-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-3 p-1 hover:bg-white/20 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2.5 min-w-0">
          <Link
            to="/reports"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0 shadow-sm"
            title="Hisobotlar bo'limiga qaytish"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2 truncate">
              <Trash2 className="h-5 w-5 text-rose-400" />
              <span>Savatcha (Chiqindi qutisi)</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              O'chirilgan kargolar, reyslar va partiyalar (30 kun ichida tiklash mumkin)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <button
            onClick={loadItems}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-accent transition-all active:scale-95 shadow-sm"
            title="Yangilash"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>

          {items.length > 0 && (
            <button
              onClick={() => setShowPurgeModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
              title="30 kundan oshgan yoki barcha eskirganlarni tozalash"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 rounded-2xl border border-border bg-card shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jami Savatchada</span>
          <p className="text-xl sm:text-2xl font-black text-foreground font-mono">{items.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Kargolar</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{cargoCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Reyslar</span>
          <p className="text-xl sm:text-2xl font-black text-teal-400 font-mono">{reysCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Karobkalar</span>
          <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{entryCount}</p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Barchasi ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("cargo")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "cargo"
                ? "bg-card text-emerald-400 shadow-sm border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Kargolar ({cargoCount})
          </button>
          <button
            onClick={() => setActiveTab("reys")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "reys"
                ? "bg-card text-teal-400 shadow-sm border border-teal-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Reyslar ({reysCount})
          </button>
          <button
            onClick={() => setActiveTab("entry")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "entry"
                ? "bg-card text-amber-400 shadow-sm border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Karobkalar ({entryCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Savatchadan qidirish..."
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Savatcha yuklanmoqda...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl space-y-3">
          <Trash2 className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">Savatcha bo'sh</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? "Qidiruv bo'yicha hech qanday o'chirilgan element topilmadi."
              : "Hozirda savatchada hech qanday kargo, reys yoki karobka yo'q."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const key = `${item.entity_type}_${item.entity_id}`;
            const isRestoring = restoringId === key;
            const dateStr = item.deleted_at
              ? new Date(item.deleted_at * 1000).toLocaleString("uz-UZ", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Sana noma'lum";

            // Icon & Color by entity_type
            let EntityIcon = Box;
            let typeLabel = "Karobka";
            let typeBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";

            if (item.entity_type === "cargo") {
              EntityIcon = Package;
              typeLabel = "Kargo";
              typeBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            } else if (item.entity_type === "reys") {
              EntityIcon = Truck;
              typeLabel = "Reys";
              typeBadgeClass = "bg-teal-500/10 text-teal-400 border-teal-500/20";
            }

            // Days remaining color
            const daysLeft = item.days_remaining;
            let daysClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            if (daysLeft <= 7) {
              daysClass = "text-rose-400 bg-rose-500/10 border-rose-500/20";
            } else if (daysLeft <= 15) {
              daysClass = "text-amber-400 bg-amber-500/10 border-amber-500/20";
            }

            return (
              <div
                key={key}
                className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 bg-card shadow-lg hover:border-primary/40 transition-all space-y-4 glass-panel"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted border border-border text-foreground shrink-0 group-hover:scale-105 transition-transform">
                      <EntityIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${daysClass}`}>
                          <Clock className="h-3 w-3" />
                          <span>{daysLeft} kun qoldi</span>
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground truncate mt-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Details & Delete Time */}
                <div className="space-y-1 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                  {item.details && (
                    <p className="line-clamp-2 text-foreground/80 font-medium">
                      {item.details}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    O'chirilgan: <span className="font-mono">{dateStr}</span>
                  </p>
                </div>

                {/* Restore Button */}
                <div className="pt-1">
                  <button
                    onClick={() => handleRestore(item)}
                    disabled={isRestoring}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold text-xs transition-all active:scale-98 shadow-sm disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    <span>{isRestoring ? "Tiklanmoqda..." : "Qayta tiklash"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Purge */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-5 glass-panel">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Savatchani tozalash</h3>
                <p className="text-xs text-muted-foreground">30 kundan oshgan yozuvlar butunlay o'chiriladi</p>
              </div>
            </div>

            <p className="text-xs text-foreground/80 leading-relaxed">
              Ushbu amal eskirgan kargolar, reyslar va partiyalarni bazadan butunlay yo'q qiladi. Tiklash imkoni bo'lmaydi. Davom ettirasizmi?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={isPurging}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isPurging ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{isPurging ? "Tozalanmoqda..." : "Ha, tozalansin"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
