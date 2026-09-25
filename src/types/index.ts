export interface Report {
  id: number;
  name: string;
  created_at: string;
  is_active: boolean;
  total_net_weight: number;
  total_entries_count: number;
}

export interface ReysItem {
  id: number;
  code: string;
  cargo_id?: number;
  toza_kg: number;
  karobka_plus_kg: number;
  date: string;
  custom_name?: string;
  original_toza_kg?: number;
  original_karobka_plus_kg?: number;
  adjustment_diff_kg?: number;
}

export interface CargoItem {
  id: number;
  code: string;
  reys_count: number;
  total_toza_kg: number;
  total_karobka_plus_kg: number;
  reyslar: ReysItem[];
}

export interface InventoryItem {
  id: string;
  tovar_turi: string;
  balance_weight: number;
  package_count?: number;
  box_coefficient?: number;
  last_updated: string;
}

export interface ActivityEntry {
  id: number;
  report_id: number;
  tovar_turi: string;
  gross_weight: number;
  net_weight: number;
  coefficient: number;
  boxes_count: number;
  created_at: string;
  created_by: string;
  photos_count: number;
  status: "completed" | "pending" | "failed";
}

export interface UserSession {
  username: string;
  role: "admin" | "operator";
  auth_type: "telegram" | "passkey" | "password";
  authenticated: boolean;
}

export interface SavedEntryItem {
  id: number;
  reys_id?: number;
  box_code?: string;
  tovar_turi?: string;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  coefficient_mode?: string;
  boxCode: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  photoUrl?: string;
  photoUrls?: string[];
  createdAt: string;
}
