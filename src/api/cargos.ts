import { CargoItem } from "../types";
import { request } from "./client";

export async function fetchCargos(includeDeleted: boolean = false): Promise<{ items: CargoItem[]; total: number }> {
  return request(`/api/cargos?include_deleted=${includeDeleted}`);
}

export async function getCargo(id: number): Promise<CargoItem> {
  return request(`/api/cargos/${id}`);
}

export async function createCargo(code: string): Promise<CargoItem> {
  return request(`/api/cargos`, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function updateCargo(id: number, code: string): Promise<CargoItem> {
  return request(`/api/cargos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ code }),
  });
}

export async function deleteCargo(id: number): Promise<void> {
  return request(`/api/cargos/${id}`, {
    method: "DELETE",
  });
}

export async function restoreCargo(id: number): Promise<CargoItem> {
  return request(`/api/cargos/${id}/restore`, {
    method: "POST",
  });
}
