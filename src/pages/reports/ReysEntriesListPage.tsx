import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Trash2, 
  FileSpreadsheet, 
  Eye, 
  Box, 
  X,
  Camera,
  ZoomIn
} from "lucide-react";
import { fetchEntries, deleteEntry, getReys } from "../../api";

export interface SavedEntryItem {
  id: number;
  boxCode: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  photoUrl?: string;
  photoUrls?: string[];
  createdAt: string;
}

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
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

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
    if (viewingPhoto) {
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
  }, [viewingPhoto]);


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
        console.warn("API delete failed, removing locally", err);
      }
      setSavedEntries(savedEntries.filter((e) => e.id !== id));
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
            const itemPhotos = item.photoUrls && item.photoUrls.length > 0 
              ? item.photoUrls 
              : (item.photoUrl ? [item.photoUrl] : []);

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
                          onClick={() => setViewingPhoto(photoUrl)}
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

      {/* 5. FULLSCREEN PHOTO LIGHTBOX MODAL (Z-[90]) */}
      {viewingPhoto && (
        <div 
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-2xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewingPhoto(null)}
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
            <div className="mt-2.5 flex items-center space-x-3">
              <span className="text-[11px] sm:text-xs text-white/70">Yopish uchun bosing</span>
              <button
                type="button"
                onClick={() => setViewingPhoto(null)}
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
