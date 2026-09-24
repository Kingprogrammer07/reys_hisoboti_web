import React from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "../../utils/useNetworkStatus";

export const NetworkStatusBadge: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, runSync } = useNetworkStatus();

  if (isOnline && pendingCount === 0) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
        title="Tizim serverga ulangan (Onlayn)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="hidden sm:inline">Onlayn</span>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <button
        onClick={runSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all active:scale-95"
        title="Internet bor. Bosing - oflayn ma'lumotlar serverga yuboriladi."
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
        <span>
          {isSyncing ? "Sinxronlanmoqda..." : `${pendingCount} ta sinxronlash`}
        </span>
      </button>
    );
  }

  // Offline
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium animate-pulse"
      title="Internet yo'q. Qutilar va rasmlar telefon xotirasiga (IndexedDB) saqlanmoqda."
    >
      <WifiOff className="h-3 w-3 shrink-0" />
      <span>Oflayn ({pendingCount} ta xotirada)</span>
    </div>
  );
};
