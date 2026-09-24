import { request } from "./client";

export interface InventoryItem {
  id: number;
  reys_id: number;
  tovar_turi: string;
  weight: number;
  package_count: number;
  box_coefficient: number;
  updated_at: number;
}

export interface CustomTypeItem {
  name: string;
  created_at: number;
}

export async function fetchInventory(reysId: number): Promise<{ items: InventoryItem[]; total: number }> {
  return request(`/api/reys/${reysId}/inventory`);
}

export async function fetchCustomTypes(): Promise<CustomTypeItem[]> {
  return request(`/api/custom-types`);
}

export async function createCustomType(name: string): Promise<CustomTypeItem> {
  return request(`/api/custom-types`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteCustomType(name: string): Promise<void> {
  return request(`/api/custom-types/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}
