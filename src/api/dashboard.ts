import { request } from "./client";

export interface DashboardStatsResponse {
  status: string;
  total_net_weight: number;
  total_entries_count: number;
  cargos_count: number;
  reys_count: number;
  active_tovar_types_count: number;
  today_added_kg: number;
  inventory: Array<{
    id: number;
    tovar_turi: string;
    balance_weight: number;
    package_count: number;
    box_coefficient: number;
  }>;
  recent_activities: Array<{
    id: number;
    reys_id: number;
    box_code: string;
    tovar_turi: string;
    gross_weight: number;
    coefficient: number;
    net_weight: number;
    created_by: string;
    photos_count: number;
    created_at: string;
  }>;
}

export interface ActivityItem {
  id: number;
  reys_id: number;
  box_code: string;
  tovar_turi: string;
  gross_weight: number;
  coefficient: number;
  net_weight: number;
  created_by: string;
  photos_count: number;
  created_at: string;
}

export const dashboardApi = {
  getStats: () => request<DashboardStatsResponse>("/api/dashboard/stats"),
  getActivities: (limit: number = 100) => request<ActivityItem[]>(`/api/activities?limit=${limit}`),
};
