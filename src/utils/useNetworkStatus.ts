import { useEffect, useState } from "react";
import { getOfflineQueueCount, syncOfflineQueue } from "./offlineQueue";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const refreshCount = async () => {
    const count = await getOfflineQueueCount();
    setPendingCount(count);
  };

  const runSync = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
      await refreshCount();
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshCount();

    const handleOnline = () => {
      setIsOnline(true);
      runSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      refreshCount();
      if (navigator.onLine) {
        runSync();
      }
    }, 15000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    refreshCount,
    runSync,
  };
}
