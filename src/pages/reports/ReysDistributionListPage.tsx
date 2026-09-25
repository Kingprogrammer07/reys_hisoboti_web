import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Edit2,
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  ZoomIn, 
  Scale, 
  Layers, 
  Clock, 
  Plus
} from "lucide-react";
import { getReys, fetchEntries, deleteEntry, downloadFile, updateEntry } from "../../api";
import { SavedEntryItem } from "../../types";

export const ReysDistributionListPage: React.FC = () => {
  const { reysId } = useParams<{ reysId: string }>();
  const navigate = useNavigate();

  const [reys, setReys] = useState<{ id: number; code: string } | null>(null);
  const [entries, setEntries] = useState<SavedEntryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const viewingPhoto = lightboxPhotos[lightboxIndex] || null;
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  const lightboxTouchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  const handleLightboxTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    lightboxTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLightboxTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = lightboxTouchStartRef.current;
    lightboxTouchStartRef.current = null;
    if (!start || lightboxPhotos.length <= 1) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    moveLightbox(dx < 0 ? 1 : -1);
  };

  const focusAboveKeyboard = (el: HTMLInputElement | null) => {
    setTimeout(() => {
      try {
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {}
    }, 250);
  };

  const loadData = async () => {
    if (!reysId) return;
    try {
      setLoading(true);
      const [r, ent] = await Promise.all([
        getReys(Number(reysId)).catch(() => null),
        fetchEntries(Number(reysId)).catch(() => ({ items: [], total: 0 })),
      ]);
      if (r) setReys(r);
      if (ent && Array.isArray(ent.items)) {
        setEntries(ent.items);
      }
    } catch (err) {
      console.warn("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reysId]);

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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        focusAboveKeyboard(searchInputRef.current);
        return;
      }
      if (e.key === "Escape") {
        if (viewingPhoto) closeLightbox();
        else if (editingEntry) setEditingEntry(null);
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
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewingPhoto, editingEntry, editForm, lightboxPhotos.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Ushbu yozuvni savatchaga ko'chirishni tasdiqlaysizmi?")) return;
    setDeletingId(id);
    try {
      await deleteEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("✓ Yozuv savatchaga ko'chirildi.");
    } catch (err: any) {
      alert(`O'chirishda xatolik: ${err?.message || "Server bilan aloqa yo'q"}`);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditEntry = (entry: SavedEntryItem) => {
    setEditingEntry(entry);
    setEditForm({
      box_code: entry.box_code || entry.boxCode || "",
      tovar_turi: entry.tovar_turi || "",
      gross_weight: String(entry.gross_weight ?? entry.grossWeight ?? ""),
      tare_weight: String(entry.tare_weight ?? entry.tareWeight ?? 0),
      coefficient_mode: entry.coefficient_mode || "none",
    });
    setTimeout(() => {
      editBoxInputRef.current?.focus();
      focusAboveKeyboard(editBoxInputRef.current);
    }, 80);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || savingEdit) return;
    const gross = Number(editForm.gross_weight);
    const tare = Number(editForm.tare_weight || 0);
    if (!editForm.box_code.trim() || !editForm.tovar_turi.trim()) {
      alert("Karobka kodi va tovar turini kiriting.");
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
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingEntry(null);
      showToast("✓ Yozuv tahrirlandi.");
    } catch (err: any) {
      alert(`Tahrirlashda xatolik: ${err?.message || "Server bilan aloqa yo'q"}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!reys) return;
    try {
      await downloadFile(`/api/export/kargo?report_id=${reys.id}`, `${reys.code}_KARGOLARGA_TARQATISH.xlsx`);
      showToast("✓ Excel hisoboti yuklab olindi.");
    } catch (err: any) {
      alert(`Excel yuklab olishda xatolik: ${err?.message || "Xato yuz berdi"}`);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchBox = e.boxCode?.toLowerCase().includes(q) || false;
    const matchWeight = String(e.grossWeight).includes(q) || String(e.netWeight).includes(q);
    return matchBox || matchWeight;
  });

  const totalGross = filteredEntries.reduce((sum, e) => sum + (e.grossWeight || 0), 0);
  const totalNet = filteredEntries.reduce((sum, e) => sum + (e.netWeight || 0), 0);

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
            to={`/reports/reys/${reysId}/distribute`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors shrink-0 shadow-sm"
            title="Formaga qaytish"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center space-x-2 truncate">
              <span>{reys?.code || "Reys"}</span>
              <span className="text-xs font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                Tarqatilgan yuklar
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
              Kiritilgan partiyalar va fotosuratlar monitoringi
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => navigate(`/reports/reys/${reysId}/distribute`)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-400 text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Yangi qo'shish</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 rounded-2xl border border-border bg-card shadow-sm space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jami Partiyalar</span>
          <p className="text-lg sm:text-xl font-black text-foreground font-mono">{filteredEntries.length} ta</p>
        </div>
        <div className="p-3 rounded-2xl border border-border bg-card shadow-sm space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Umumiy Og'irlik</span>
          <p className="text-lg sm:text-xl font-black text-foreground font-mono">{totalGross.toFixed(2)} kg</p>
        </div>
        <div className="p-3 rounded-2xl border border-teal-500/20 bg-teal-500/5 shadow-sm space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Jami Sof Vazn</span>
          <p className="text-lg sm:text-xl font-black text-teal-400 font-mono">{totalNet.toFixed(2)} kg</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tovar turi, kod yoki og'irlik bo'yicha qidirish..."
          className="w-full h-11 pl-10 pr-9 rounded-2xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Entries List */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-teal-400" />
          Yuklanganlar ro'yxati ochilmoqda...
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl space-y-3">
          <Layers className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">Hozircha yozuvlar yo'q</h3>
          <p className="text-xs text-muted-foreground">Kargolarga tarqatish formasiga o'tib yangi partiya qo'shishingiz mumkin.</p>
          <button
            onClick={() => navigate(`/reports/reys/${reysId}/distribute`)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-bold shadow-md hover:bg-teal-400"
          >
            <Plus className="h-4 w-4" />
            <span>Tarqatish formasiga o'tish</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const isDeleting = deletingId === entry.id;
            const photos = entry.photoUrls || (entry.photoUrl ? [entry.photoUrl] : []);

            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-white/10 bg-card shadow-md hover:border-teal-500/30 transition-all gap-3 glass-panel"
              >
                {/* Left: Code, Weights, Date */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-mono font-bold uppercase">
                      {entry.boxCode}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{entry.createdAt}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-muted-foreground">
                      Og'irlik: <strong className="text-foreground">{entry.grossWeight} kg</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Karobka: <strong className="text-foreground">{entry.tareWeight} kg</strong>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      Toza: {entry.netWeight} kg
                    </span>
                  </div>
                </div>

                {/* Right: Photos & Actions */}
                <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                  {/* Photo Thumbnails */}
                  {photos.length > 0 && (
                    <div className="flex items-center -space-x-2">
                      {photos.slice(0, 3).map((p, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => openLightbox(photos, pIdx)}
                          className="h-10 w-10 rounded-xl overflow-hidden border-2 border-card bg-black/60 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                        >
                          <img src={p} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {photos.length > 3 && (
                        <div
                          onClick={() => openLightbox(photos, 3)}
                          className="h-10 w-10 rounded-xl bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground font-mono cursor-pointer"
                        >
                          +{photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => openEditEntry(entry)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                    title="Tahrirlash"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    disabled={isDeleting}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                    title="Savatchaga ko'chirish"
                  >
                    {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-card p-4 sm:p-5 shadow-2xl space-y-4 glass-panel">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">Partiyani tahrirlash</h3>
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
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:border-teal-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Tovar turi</span>
                <input
                  value={editForm.tovar_turi}
                  onFocus={(e) => focusAboveKeyboard(e.currentTarget)}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, tovar_turi: e.target.value }))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-teal-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:border-teal-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:border-teal-500 focus:outline-none"
                  />
                </label>
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-xs font-bold text-white hover:bg-teal-600 disabled:opacity-50"
              >
                {savingEdit ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Saqlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {viewingPhoto && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div
            className="relative max-w-2xl max-h-[90vh] flex flex-col items-center select-none touch-pan-y"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-10 sm:-top-12 right-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              title="Yopish"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <img src={viewingPhoto} alt="Rasm" className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20" />
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
                {lightboxPhotos.length > 1 ? `${lightboxIndex + 1}/${lightboxPhotos.length} · swipe / ←/→` : "Yopish uchun bosing"}
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
