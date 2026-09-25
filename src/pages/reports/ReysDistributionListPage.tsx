import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
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
import { getReys, fetchEntries, deleteEntry, downloadFile } from "../../api";
import { SavedEntryItem } from "../../types";

export const ReysDistributionListPage: React.FC = () => {
  const { reysId } = useParams<{ reysId: string }>();
  const navigate = useNavigate();

  const [reys, setReys] = useState<{ id: number; code: string } | null>(null);
  const [entries, setEntries] = useState<SavedEntryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
                          onClick={() => setViewingPhoto(p)}
                          className="h-10 w-10 rounded-xl overflow-hidden border-2 border-card bg-black/60 cursor-pointer hover:scale-110 transition-transform shadow-xs"
                        >
                          <img src={p} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {photos.length > 3 && (
                        <div className="h-10 w-10 rounded-xl bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground font-mono">
                          +{photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete Button */}
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

      {/* Lightbox Modal */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
        >
          <img src={viewingPhoto} alt="Rasm" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl" />
          <button
            onClick={() => setViewingPhoto(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white border border-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

    </div>
  );
};
