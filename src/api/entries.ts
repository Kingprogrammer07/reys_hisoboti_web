import { SavedEntryItem } from "../types";
import { request } from "./client";

export interface CreateEntryPayload {
  reys_id: number;
  box_code: string;
  tovar_turi: string;
  gross_weight: number;
  tare_weight: number;
  coefficient_mode?: string;
  created_by?: string;
}

export async function fetchEntries(
  reysId: number,
  includeDeleted: boolean = false
): Promise<{ items: SavedEntryItem[]; total: number }> {
  return request(`/api/reys/${reysId}/entries?include_deleted=${includeDeleted}`);
}

export async function createEntry(
  data: CreateEntryPayload,
  photos?: (File | Blob)[]
): Promise<SavedEntryItem> {
  if (photos && photos.length > 0) {
    const formData = new FormData();
    formData.append("reys_id", String(data.reys_id));
    formData.append("box_code", data.box_code);
    formData.append("tovar_turi", data.tovar_turi);
    formData.append("gross_weight", String(data.gross_weight));
    formData.append("tare_weight", String(data.tare_weight || 0));
    formData.append("coefficient_mode", data.coefficient_mode || "none");
    formData.append("created_by", data.created_by || "operator");

    photos.forEach((photo, idx) => {
      formData.append("photos", photo, `photo_${idx}.jpg`);
    });

    return request(`/api/reys/${data.reys_id}/entries`, {
      method: "POST",
      body: formData,
    });
  }

  // Fast direct JSON path
  return request(`/api/entries/json`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteEntry(id: number): Promise<void> {
  return request(`/api/entries/${id}`, {
    method: "DELETE",
  });
}

export async function restoreEntry(id: number): Promise<SavedEntryItem> {
  return request(`/api/entries/${id}/restore`, {
    method: "POST",
  });
}
