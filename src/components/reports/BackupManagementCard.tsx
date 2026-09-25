import React, { useEffect, useState } from "react";
import {
  Database,
  Download,
  Send,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { backupApi, BackupStatsResponse } from "../../api/backup";
import { downloadFile } from "../../api/client";

export const BackupManagementCard: React.FC = () => {
  const [data, setData] = useState<BackupStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await backupApi.getStats();
      setData(res);
    } catch (err: any) {
      console.error("Zaxira ma'lumotlarini yuklashda xatolik:", err);
      setMessage({
        type: "error",
        text: "Serverga ulanishda xatolik: " + (err?.message || "Server bilan aloqa o'rnatilmadi"),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSendTelegram = async () => {
    try {
      setSendingTelegram(true);
      setMessage(null);
      const res = await backupApi.sendToTelegram();
      setMessage({
        type: "success",
        text: res.message || "Zaxira nusxasi Telegram kanalga yuborildi!",
      });
      fetchStats();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Telegramga yuborishda xatolik yuz berdi.",
      });
    } finally {
      setSendingTelegram(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadFile("/api/backup/download", "hisobot_backup.dump");
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Zaxira faylini yuklab olishda xatolik.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".dump")) {
      setMessage({
        type: "error",
        text: "Faqat '.dump' formatidagi fayllarni tiklash mumkin.",
      });
      return;
    }

    const confirmRestore = window.confirm(
      `Diqqat! "${file.name}" faylidagi ma'lumotlar bazaga qayta tiklanadi. Davom etishni xohlaysizmi?`
    );
    if (!confirmRestore) {
      e.target.value = "";
      return;
    }

    try {
      setRestoring(true);
      setMessage(null);
      const res = await backupApi.restore(file);
      setMessage({
        type: "success",
        text: res.message || "Baza muvaffaqiyatli tiklandi!",
      });
      fetchStats();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Zaxiradan tiklashda xatolik yuz berdi.",
      });
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-card p-6 md:p-8 shadow-xl glass-panel relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              Ma'lumotlar Xavfsizligi va Zaxira (Backup)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              PostgreSQL Native <code className="text-cyan-400">.dump</code> formatida to'liq avtomatik zaxiralash
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background/50 hover:bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          title="Ma'lumotlarni yangilash"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Status Alert */}
      {message && (
        <div
          className={`mt-4 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
        <div className="rounded-2xl border border-border/50 bg-background/40 p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>Baza turi</span>
          </div>
          <div className="mt-1 font-semibold text-sm flex items-center gap-1.5">
            {loading && !data ? (
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" /> Tekshirilmoqda...
              </span>
            ) : data?.stats?.backend === "postgres" ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Neon PostgreSQL
              </span>
            ) : data?.stats?.backend === "sqlite" ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Lokal SQLite (Standby)
              </span>
            ) : (
              <span className="text-red-400 font-semibold text-xs">Baza holati noma'lum</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background/40 p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Rejalashtirilgan zaxira</span>
          </div>
          <div className="mt-1 font-semibold text-sm text-foreground">
            Har {data?.interval_hours || 24} soatda (30 kunlik saqlash)
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background/40 p-3.5">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Send className="h-3.5 w-3.5 text-blue-400" />
            <span>Telegram Zaxira Kanali</span>
          </div>
          <div className="mt-1 font-semibold text-sm text-cyan-400 font-mono">
            {data?.backup_channel || "-1002982052676"}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {/* 1. Download Dump */}
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs md:text-sm shadow-lg shadow-cyan-600/20 active:scale-98 transition-all"
        >
          <Download className="h-4 w-4" />
          <span>Zaxira nusxani yuklab olish (.dump)</span>
        </button>

        {/* 2. Send to Telegram */}
        <button
          onClick={handleSendTelegram}
          disabled={sendingTelegram}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium text-xs md:text-sm active:scale-98 transition-all disabled:opacity-50"
        >
          <Send className={`h-4 w-4 ${sendingTelegram ? "animate-pulse" : ""}`} />
          <span>{sendingTelegram ? "Telegramga yuborilmoqda..." : "Telegram kanalga yuborish"}</span>
        </button>

        {/* 3. Restore from Dump */}
        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border bg-background/60 hover:bg-background text-muted-foreground hover:text-foreground font-medium text-xs md:text-sm active:scale-98 transition-all cursor-pointer">
          <UploadCloud className={`h-4 w-4 ${restoring ? "animate-spin" : ""}`} />
          <span>{restoring ? "Tiklanmoqda..." : "Zaxiradan tiklash"}</span>
          <input
            type="file"
            accept=".dump"
            className="hidden"
            onChange={handleRestoreFile}
            disabled={restoring}
          />
        </label>
      </div>

      {/* Recent Backup Files List */}
      {data?.files && data.files.length > 0 && (
        <div className="mt-6 border-t border-border/40 pt-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Serverdagi so'nggi zaxira nusxalari:
          </span>
          <div className="mt-2 space-y-1.5">
            {data.files.slice(0, 3).map((f, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-background/30 border border-border/30 text-muted-foreground font-mono"
              >
                <span className="text-foreground">{f.filename}</span>
                <span className="text-cyan-400">{f.size_formatted}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
