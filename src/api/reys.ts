import { ReysItem } from "../types";
import { request } from "./client";

export interface CreateReysDto {
  cargo_id?: number;
  code: string;
  date: string;
  custom_name?: string;
}

export async function fetchReyslar(
  cargoId?: number,
  includeDeleted: boolean = false
): Promise<{ items: ReysItem[]; total: number }> {
  let url = `/api/reys?include_deleted=${includeDeleted}`;
  if (cargoId) {
    url += `&cargo_id=${cargoId}`;
  }
  return request(url);
}

export async function getReys(id: number): Promise<ReysItem> {
  return request(`/api/reys/${id}`);
}

export async function createReys(data: CreateReysDto): Promise<ReysItem> {
  return request(`/api/reys`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReys(id: number, data: Partial<CreateReysDto>): Promise<ReysItem> {
  return request(`/api/reys/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReys(id: number): Promise<void> {
  return request(`/api/reys/${id}`, {
    method: "DELETE",
  });
}

export async function restoreReys(id: number): Promise<ReysItem> {
  return request(`/api/reys/${id}/restore`, {
    method: "POST",
  });
}

export async function adjustReys(
  id: number,
  actualTozaKg: number,
  actualKarobkaPlusKg: number = 0
): Promise<ReysItem> {
  return request(`/api/reys/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify({
      actual_toza_kg: actualTozaKg,
      actual_karobka_plus_kg: actualKarobkaPlusKg,
    }),
  });
}
