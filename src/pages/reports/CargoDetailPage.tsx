import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { MOCK_CARGOS } from "../../mock/data";
import { ReysCard } from "../../components/reports/ReysCard";

// ROUTE: /reports/cargos/:cargoId
export const CargoDetailPage: React.FC = () => {
  const { cargoId } = useParams<{ cargoId: string }>();
  const cargo = MOCK_CARGOS.find((c) => c.id === Number(cargoId)) || MOCK_CARGOS[0];

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReys = cargo.reyslar.filter((r) =>
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // TOP 3 VISIBLE BY DEFAULT, REST COLLAPSED
  const visibleReys = isExpanded ? filteredReys : filteredReys.slice(0, 3);
  const hasMore = filteredReys.length > 3;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/reports/cargos"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{cargo.code}</h1>
          <p className="text-xs text-muted-foreground">Kargo ichidagi reyslar ro'yxati (URL: /reports/cargos/{cargo.id})</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Reys kodi bo'yicha qidirish..."
          className="w-full rounded-2xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Reys Cards Grid */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibleReys.map((reys) => (
            <ReysCard key={reys.id} reys={reys} />
          ))}
        </div>

        {/* Collapse / Expand Toggle */}
        {hasMore && (
          <div className="text-center pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center space-x-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <span>
                {isExpanded
                  ? "Yopish (Faqat 3 ta ko'rsatish)"
                  : `Qolgan ${filteredReys.length - 3} ta reysni ko'rsatish`}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-emerald-400" />
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
