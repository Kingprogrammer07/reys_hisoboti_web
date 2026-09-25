import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Trash2, 
  FileSpreadsheet, 
  Box, 
  X,
  Camera,
  ZoomIn,
  Edit2,
  Save,
  RefreshCw
} from "lucide-react";
import { fetchEntries, deleteEntry, getReys, updateEntry } from "../../api";
import { SavedEntryItem } from "../../types";

const CATEGORY_NAMES: Record<string, string> = {
  top: "TOP",
  top_dan_chiqgan: "TOP'dan chiqgan",
  bizdan_chiqgan: "Bizdan chiqgan",
  bizda_qoladigan: "Bizda qoladigan",
  umumiy_hisobot: "Umumiy hisobot",
};

// ROUTE: /reports/reys/:reysId/entry/:categoryId/list
export const ReysEntriesListPage: React.FC = () => {
  const { reysId, categoryId = "top" } = useParams<{ reysId: string; categoryId: string }>();

  const [reys, setReys] = useState<{ id: number; code: string; custom_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reysId) {
      getReys(Number(reysId))
        .then((r) => {
          if (r) setReys(r);
        })
        .catch(() => {});
    }
  }, [reysId]);

  const categoryTitle = CATEGORY_NAMES[categoryId] || "TOP";
  const storageKey = `mandarin_entries_${reysId}_${categoryId}`;

  // Saved Entries State initialized from localStorage or empty
  const [savedEntries, setSavedEntries] = useState<SavedEntryItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const viewingPhoto = lightboxPhotos[lightboxIndex] || null;
  const [editingEntry, setEditingEntry] = useState<SavedEntryItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    box_code: "",
    tovar_turi: "",
    gross_weight: "",
    tare_weight: "",
    coefficient_mode: "none",
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const editBoxInputRef = useRef<HTMLInputElement>(null);

  const closeLightbox = () => {
    setLightboxPhotos([]);
    setLightboxIndex(0);
  };

  const openLightbox = (photos: string[], idx: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(idx);
  };

  const moveLightbox = (delta: number) => {
    setLightboxIndex((idx) => {
      if (lightboxPhotos.length === 0) return 0;
      return (idx + delta + lightboxPhotos.length) % lightboxPhotos.length;
    });
  };

  const focusAboveKeyboard = (el: HTMLInputElement | null) => {
    setTimeout(() => {
      try {
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {}
    }, 250);
  };

  const openEditEntry = (item: SavedEntryItem) => {
    setEditingEntry(item);
    setEditForm({
      box_code: item.box_code || item.boxCode || "",
      tovar_turi: item.tovar_turi || categoryTitle,
      gross_weight: String(item.gross_weight ?? item.grossWeight ?? ""),
      tare_weight: String(item.tare_weight ?? item.tareWeight ?? 0),
      coefficient_mode: item.coefficient_mode || "none",
    });
    setTimeout(() => {
      editBoxInputRef.current?.focus();
      focusAboveKeyboard(editBoxInputRef.current);
    }, 80);
  };

  // Sync state changes with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(savedEntries));
    } catch (e) {
      console.error(e);
    }
  }, [savedEntries, storageKey]);

  // Hide global mobile navigation and lock background when lightbox is open
  useEffect(() => {
    if (viewingPhoto || editingEntry) {
      document.body.classList.add("camera-active");
      window.dispatchEvent(new Event("camera-state-change"));
    } else {
      document.body.classList.remove("camera-active");
      window.dispatchEvent(new Event("camera-state-change"));
    }
    return () => {
      document.body.classList.remove("camera-active");
      window.dispatchEvent(new Event("camera-state-change"));
    };
  }, [viewingPhoto, editingEntry]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toUpperCase();
      const typing = activeTag === "INPUT" || activeTag === "TEXTAREA";

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        focusAboveKeyboard(searchInputRef.current);
        return;
      }

      if (e.key === "Escape") {
        if (viewingPhoto) {
          closeLightbox();
        } else if (editingEntry) {
          setEditingEntry(null);
        }
        return;
      }

      if (viewingPhoto && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        moveLightbox(e.key === "ArrowLeft" ? -1 : 1);
        return;
      }

      if (editingEntry && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit();
        return;
      }

      if (!typing && !viewingPhoto && !editingEntry && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewingPhoto, editingEntry, editForm, lightboxPhotos.length]);


  // Load entries from Backend API on mount
  useEffect(() => {
    if (reysId) {
      setLoading(true);
      fetchEntries(Number(reysId))
        .then((res) => {
          if (res && Array.isArray(res.items)) {
            setSavedEntries(res.items);
          }
        })
        .catch((err) => console.warn("Could not load live entries from API", err))
        .finally(() => setLoading(false));
    }
  }, [reysId]);

  // Delete an entry
  const handleDeleteEntry = async (id: number) => {
    if (window.confirm("Rostdan ham ushbu yozuvni o'chirmoqchimisiz?")) {
      try {
        await deleteEntry(id);
      } catch (err) {
        alert(`O'chirishda xatolik: ${(err as any)?.message || "Server bilan aloqa yo'q"}`);
        return;
      }
      setSavedEntries(savedEntries.filter((e) => e.id !== id));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || savingEdit) return;
    const gross = Number(editForm.gross_weight);
    const tare = Number(editForm.tare_weight || 0);
    if (!editForm.box_code.trim()) {
      alert("Karobka kodini kiriting.");
      editBoxInputRef.current?.focus();
      return;
    }
    if (!editForm.tovar_turi.trim()) {
      alert("Tovar turini kiriting.");
      return;
    }
    if (!gross || gross <= 0) {
      alert("Og'irlikni to'g'ri kiriting.");
      return;
    }
    if (tare < 0 || tare >= gross) {
      alert("Karobka og'irligi umumiy og'irlikdan kichik bo'lishi kerak.");
      return;
    }

    try {
      setSavingEdit(true);
      const updated = await updateEntry(editingEntry.id, {
        box_code: editForm.box_code.trim(),
        tovar_turi: editForm.tovar_turi.trim(),
        gross_weight: gross,
        tare_weight: tare,
        coefficient_mode: editForm.coefficient_mode || "none",
      });
      setSavedEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingEntry(null);
    } catch (err: any) {
      alert(`Tahrirlashda xatolik: ${err?.message || "Server bilan aloqa yo'q"}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter entries by search query
  const filteredEntries = savedEntries.filter((e) =>
    e.boxCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalNetWeight = savedEntries.reduce((sum, e) => sum + e.netWeight, 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-12 max-w-5xl mx-auto px-2 sm:px-4">
      
      {/* 1. TOP HEADER (320px RESPONSIVE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2.5">
          <Link
            to={`/reports/reys/${reysId}/entry/${categoryId}`}
            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0"
            title="Kiritish formasiga qaytish"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-extrabold tracking-tight text-foreground flex items-center flex-wrap gap-1.5">
              <span>{categoryTitle} — Yuklanganlar</span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono shrink-0">
                {reys?.code || `REYS-${reysId}`}
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              Kiritilgan karobkalar va fotosuratlar ro'yxati
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => alert(`${reys?.code || 'Reys'} — ${categoryTitle} bo'yicha ${savedEntries.length} ta karobka Excel hisoboti yuklab olinmoqda...`)}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 rounded-xl bg-card border border-border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
            <span>Excel</span>
          </button>

          <Link
            to={`/reports/reys/${reysId}/entry/${categoryId}`}
            className="inline-flex items-center space-x-1 sm:space-x-1.5 rounded-xl bg-emerald-500 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-md shadow-emerald-500/25"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" />
            <span>Kiritish</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS BANNER (FITS 320px WITHOUT OVERFLOW) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
        <div className="p-2.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs glass-panel">
          <span className="text-muted-foreground text-[10px] sm:text-[11px] block">Jami karobka:</span>
          <strong className="text-foreground text-sm sm:text-lg md:text-xl font-mono font-bold block truncate">
            {savedEntries.length} ta
          </strong>
        </div>
        <div className="p-2.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs glass-panel">
          <span className="text-muted-foreground text-[10px] sm:text-[11px] block">Jami toza:</span>
          <strong className="text-emerald-400 text-sm sm:text-lg md:text-xl font-mono font-bold block truncate">
            {totalNetWeight.toFixed(2)} kg
          </strong>
        </div>
        <div className="p-2.5 sm:p-4 rounded-2xl bg-card border border-border shadow-xs glass-panel">
          <span className="text-muted-foreground text-[10px] sm:text-[11px] block">O'rtacha:</span>
          <strong className="text-teal-400 text-sm sm:text-lg md:text-xl font-mono font-bold block truncate">
            {savedEntries.length > 0 ? (totalNetWeight / savedEntries.length).toFixed(2) : 0} kg
          </strong>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Karobka kodi bo'yicha qidirish (Masalan: 101)..."
          className="w-full rounded-2xl border border-input bg-card pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground focus:border-emerald-500 focus:outline-none shadow-xs"
        />
      </div>

      {/* 4. ITEMS LIST (RESPONSIVE CARDS WITH MULTI-PHOTO GALLERY) */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-card p-8 sm:p-12 text-center shadow-xl space-y-3 glass-panel">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 mx-auto items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Box className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">Karobkalar topilmadi</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery 
              ? "Qidiruv bo'yicha hech qanday karobka topilmadi." 
              : "Ushbu toifaga hozircha hech qanday karobka kiritilmagan."}
          </p>
          <div className="pt-2">
            <Link
              to={`/reports/reys/${reysId}/entry/${categoryId}`}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Birinchi karobkani kiritish</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredEntries.map((item) => {
            // Resolve all photos for this item (multi-photo or single photo)
            const rawPhotos = item.photoUrls && item.photoUrls.length > 0 
              ? item.photoUrls 
              : (item.photoUrl ? [item.photoUrl] : []);
            
            // Normalize any raw S3 URLs to the reliable backend proxy endpoint
            const itemPhotos = rawPhotos.map((url, idx) => {
              if (url && url.includes("r2.cloudflarestorage.com")) {
                return `/api/entries/${item.id}/photos/${idx}`;
              }
              return url;
            });

            return (
              <div 
                key={item.id}
                className="p-3 sm:p-4 rounded-2xl border border-border bg-card hover:border-emerald-500/40 hover:shadow-lg transition-all space-y-2.5 glass-panel"
              >
                {/* Top Row: Box Code Badge, Net Weight, and Delete Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-mono font-extrabold text-sm sm:text-base border border-emerald-500/20">
                      #{item.boxCode}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm sm:text-base font-extrabold text-foreground font-mono">
                          {item.netWeight} kg
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                          Toza
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Vaqt: {item.createdAt}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditEntry(item)}
                    className="p-1.5 sm:p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Tahrirlash"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(item.id)}
                    className="p-1.5 sm:p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Middle Row: Gross and Tare Weights */}
                <div className="text-[11px] text-muted-foreground font-mono bg-muted/20 px-2.5 py-1.5 rounded-xl flex items-center justify-between">
                  <span>Og'irlik: <strong className="text-foreground font-bold">{item.grossWeight} kg</strong></span>
                  <span className="text-border">|</span>
                  <span>Karobka: <strong className="text-teal-400 font-bold">{item.tareWeight} kg</strong></span>
                </div>

                {/* Bottom Row: Photo Thumbnails Gallery */}
                <div className="flex items-center justify-between pt-0.5">
                  {itemPhotos.length > 0 ? (
                    <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-thin">
                      {itemPhotos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => openLightbox(itemPhotos, pIdx)}
                          className="relative group cursor-pointer h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-border hover:border-emerald-500 transition-colors shrink-0 shadow-xs"
                          title={`Rasm #${pIdx + 1} ni kattalashtirish`}
                        >
                          <img 
                            src={photoUrl} 
                            alt={`Box ${item.boxCode} #${pIdx + 1}`} 
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200" 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold text-white bg-black/60 px-1 rounded pointer-events-none">
                            #{pIdx + 1}
                          </span>
                        </div>
                      ))}
                      <span className="text-[10px] text-emerald-400 font-bold ml-1">
                        {itemPhotos.length} ta
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground italic flex items-center space-x-1">
                      <Camera className="h-3 w-3 text-muted-foreground/50" />
                      <span>Rasmsiz</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 5. EDIT MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-[88] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-card p-4 sm:p-5 shadow-2xl space-y-4 glass-panel">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">Yozuvni tahrirlash</h3>
                <p className="text-[11px] text-muted-foreground">Ctrl+Enter saqlaydi, Escape yopadi</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Karobka kodi</span>
                <input
                  ref={editBoxInputRef}
                  value={editForm.box_code}
                  onFocus={(e) => focusAboveKeyboard(e.currentTarget)}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, box_code: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Tovar turi</span>
                <input
                  value={editForm.tovar_turi}
                  onFocus={(e) => focusAboveKeyboard(e.currentTarget)}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tovar_turi: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Og'irlik</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editForm.gross_weight}
                    onFocus={(e) => focusAboveKeyboard(e.currentTarget)}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, gross_weight: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Karobka</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editForm.tare_weight}
                    onFocus={(e) => focusAboveKeyboard(e.currentTarget)}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, tare_weight: e.target.value }))}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                Toza vazn: <strong>{Math.max(0, Number(editForm.gross_weight || 0) - Number(editForm.tare_weight || 0)).toFixed(2)} kg</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {savingEdit ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. FULLSCREEN PHOTO LIGHTBOX MODAL (Z-[90]) */}
      {viewingPhoto && (
        <div 
          onClick={closeLightbox}
          className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-10 sm:-top-12 right-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Yopish"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <img 
              src={viewingPhoto} 
              alt="Kattalashtirilgan rasm" 
              className="max-h-[80vh] max-w-full rounded-2xl object-contain border border-white/20 shadow-2xl" 
            />
            {lightboxPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => moveLightbox(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLightbox(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5 rotate-180" />
                </button>
              </>
            )}
            <div className="mt-2.5 flex items-center space-x-3">
              <span className="text-[11px] sm:text-xs text-white/70">
                {lightboxPhotos.length > 1 ? `${lightboxIndex + 1}/${lightboxPhotos.length} · ←/→` : "Yopish uchun bosing"}
              </span>
              <button
                type="button"
                onClick={closeLightbox}
                className="px-2.5 py-1 rounded-xl bg-white/20 text-white text-[11px] sm:text-xs font-semibold hover:bg-white/30"
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
