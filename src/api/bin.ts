import { request } from "./client";

export interface BinItem {
  entity_type: "cargo" | "reys" | "entry" | "activity";
  entity_id: number;
  title: string;
  details?: string;
  deleted_at: number;
  days_remaining: number;
}

export async function fetchBinItems(): Promise<{ items: BinItem[]; total: number }> {
  return request(`/api/bin`);
}

export async function restoreBinItem(entityType: string, entityId: number): Promise<void> {
  return request(`/api/bin/restore`, {
    method: "POST",
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
    }),
  });
}

export async function purgeExpired(retentionDays: number = 30): Promise<{ purged_count: number }> {
  return request(`/api/bin/purge?retention_days=${retentionDays}`, {
    method: "POST",
  });
}
