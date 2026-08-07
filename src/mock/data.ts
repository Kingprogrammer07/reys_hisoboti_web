import { Report, InventoryItem, ActivityEntry, CargoItem } from "../types";

export const MOCK_CARGOS: CargoItem[] = [
  {
    id: 1,
    code: "KARGO-01",
    reys_count: 5,
    total_toza_kg: 92400,
    total_karobka_plus_kg: 104500,
    reyslar: [
      { id: 101, code: "REYS-45", cargo_id: 1, toza_kg: 18450, karobka_plus_kg: 20900, date: "2026-08-06" },
      { id: 102, code: "REYS-44", cargo_id: 1, toza_kg: 19200, karobka_plus_kg: 21750, date: "2026-08-04" },
      { id: 103, code: "REYS-43", cargo_id: 1, toza_kg: 17800, karobka_plus_kg: 20100, date: "2026-08-01" },
      { id: 104, code: "REYS-42", cargo_id: 1, toza_kg: 18500, karobka_plus_kg: 21000, date: "2026-07-28" },
      { id: 105, code: "REYS-41", cargo_id: 1, toza_kg: 18450, karobka_plus_kg: 20750, date: "2026-07-25" },
    ],
  },
  {
    id: 2,
    code: "KARGO-02",
    reys_count: 4,
    total_toza_kg: 74100,
    total_karobka_plus_kg: 83800,
    reyslar: [
      { id: 201, code: "REYS-12", cargo_id: 2, toza_kg: 21000, karobka_plus_kg: 23700, date: "2026-08-05" },
      { id: 202, code: "REYS-11", cargo_id: 2, toza_kg: 19500, karobka_plus_kg: 22100, date: "2026-08-02" },
      { id: 203, code: "REYS-10", cargo_id: 2, toza_kg: 17800, karobka_plus_kg: 20100, date: "2026-07-29" },
      { id: 204, code: "REYS-09", cargo_id: 2, toza_kg: 15800, karobka_plus_kg: 17900, date: "2026-07-24" },
    ],
  },
  {
    id: 3,
    code: "KARGO-03",
    reys_count: 3,
    total_toza_kg: 58900,
    total_karobka_plus_kg: 66400,
    reyslar: [
      { id: 301, code: "REYS-08", cargo_id: 3, toza_kg: 22100, karobka_plus_kg: 24900, date: "2026-08-03" },
      { id: 302, code: "REYS-07", cargo_id: 3, toza_kg: 19800, karobka_plus_kg: 22300, date: "2026-07-30" },
      { id: 303, code: "REYS-06", cargo_id: 3, toza_kg: 17000, karobka_plus_kg: 19200, date: "2026-07-26" },
    ],
  },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 101,
    name: "Reys #42 — Turkiya Mandarin Premium",
    created_at: "2026-08-06 14:30",
    is_active: true,
    total_net_weight: 18450.5,
    total_entries_count: 34,
  },
  {
    id: 100,
    name: "Reys #41 — Pokiston Mandarin (Klementin)",
    created_at: "2026-08-04 09:15",
    is_active: false,
    total_net_weight: 22100.0,
    total_entries_count: 48,
  },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: "1",
    tovar_turi: "Mandarin Standard (1-nav)",
    balance_weight: 8420.5,
    package_count: 420,
    box_coefficient: 1.4,
    last_updated: "10 daqiqa oldin",
  },
  {
    id: "2",
    tovar_turi: "Mandarin Ekstra (Premimum)",
    balance_weight: 5120.0,
    package_count: 256,
    box_coefficient: 1.4,
    last_updated: "25 daqiqa oldin",
  },
];

export const MOCK_ACTIVITIES: ActivityEntry[] = [
  {
    id: 1,
    report_id: 101,
    tovar_turi: "Mandarin Standard (1-nav)",
    gross_weight: 520.5,
    net_weight: 506.5,
    coefficient: 1.4,
    boxes_count: 10,
    created_at: "19:05",
    created_by: "Admin (Telegram)",
    photos_count: 3,
    status: "completed",
  },
];
