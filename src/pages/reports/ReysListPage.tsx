import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { MOCK_CARGOS } from "../../mock/data";
import { ReysCard } from "../../components/reports/ReysCard";

// ROUTE: /reports/reys
export const ReysListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const allReys = MOCK_CARGOS.flatMap((c) => c.reyslar).filter((r) =>
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/reports"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Barcha Reyslar Hisoboti</h1>
          <p className="text-xs text-muted-foreground">Barcha kargolar bo'yicha reyslar ro'yxati (URL: /reports/reys)</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Reys kodi bo'yicha qidirish..."
          className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Reys Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {allReys.map((reys) => (
          <ReysCard key={reys.id} reys={reys} />
        ))}
      </div>

    </div>
  );
};
