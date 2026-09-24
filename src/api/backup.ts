import { request } from "./client";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export interface BackupStatsResponse {
  status: string;
  stats: {
    cargos: number;
    reyslar: number;
    entries: number;
    photos: number;
    inventory: number;
    custom_types: number;
    backend: string;
  };
  scheduler: {
    last_run: string | null;
    last_file: string | null;
    last_status: string;
    last_error: string | null;
    file_size?: number;
    telegram_sent?: boolean;
  };
  backup_channel: string;
  interval_hours: number;
  retention_days: number;
  files: Array<{
    filename: string;
    size_bytes: number;
    size_formatted: string;
    created_at: number;
  }>;
}

export const backupApi = {
  getStats: () => request<BackupStatsResponse>("/api/backup/stats"),

  sendToTelegram: () =>
    request<{ status: string; message: string; data: any }>("/api/backup/send-telegram", {
      method: "POST",
    }),

  getDownloadUrl: () => `${API_BASE_URL}/api/backup/download`,

  restore: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ status: string; message: string; stats?: any }>("/api/backup/restore", {
      method: "POST",
      body: formData,
    });
  },
};
