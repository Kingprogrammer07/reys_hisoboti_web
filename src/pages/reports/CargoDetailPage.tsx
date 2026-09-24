import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowLeft, FileSpreadsheet, Calendar, ListFilter, Check, X, Filter, RotateCcw, SlidersHorizontal, AlertTriangle, RefreshCw } from "lucide-react";
import { ReysCard } from "../../components/reports/ReysCard";
import { getCargo } from "../../api";
import { CargoItem } from "../../types";

const formatDate = (d: Date) => d.toISOString().split("T")[0];

// ROUTE: /reports/cargos/:cargoId
export const CargoDetailPage: React.FC = () => {
  const { cargoId } = useParams<{ cargoId: string }>();
  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Mobile Filter Collapsible State (Collapsed by default on mobile for screen space)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Date Filter State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDateShortcut, setActiveDateShortcut] = useState<"all" | "today" | "yesterday" | "week" | "month" | "custom">("all");

  // Excel-Style Reys Multi-Select Checkbox Filter State
  const [selectedReysCodes, setSelectedReysCodes] = useState<string[]>([]);
  const [showReysCheckboxDropdown, setShowReysCheckboxDropdown] = useState(false);
  const [checkboxSearchQuery, setCheckboxSearchQuery] = useState("");

  // Excel Export Modal State
  const [showExcelExportModal, setShowExcelExportModal] = useState(false);

  const cargoReyslar = cargo?.reyslar || [];

  useEffect(() => {
    if (cargoId) {
      setLoading(true);
      getCargo(Number(cargoId))
        .then((data) => {
          if (data) {
            setCargo(data);
            setSelectedReysCodes((data.reyslar || []).map((r) => r.code));
          }
        })
        .catch((err) => console.warn("Could not load cargo from API", err))
        .finally(() => setLoading(false));
    }
  }, [cargoId]);

  // Check if any filter is actively applied
  const isFilterActive = Boolean(
    startDate ||
    endDate ||
    searchQuery ||
    activeDateShortcut !== "all" ||
    selectedReysCodes.length !== cargoReyslar.length
  );

  // Clear All Filters Handler
  const handleClearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setActiveDateShortcut("all");
    setSearchQuery("");
    setSelectedReysCodes(cargoReyslar.map((r) => r.code));
    setCheckboxSearchQuery("");
    setCurrentPage(1);
  };

  // Date Shortcut Handlers for on-page filter
  const handleDateShortcut = (shortcut: "all" | "today" | "yesterday" | "week" | "month") => {
    setActiveDateShortcut(shortcut);
    const now = new Date();
    const nowStr = formatDate(now);

    if (shortcut === "all") {
      setStartDate("");
      setEndDate("");
    } else if (shortcut === "today") {
      setStartDate(nowStr);
      setEndDate(nowStr);
    } else if (shortcut === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (shortcut === "week") {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(formatDate(w));
      setEndDate(nowStr);
    } else if (shortcut === "month") {
      const m = new Date();
      m.setDate(m.getDate() - 30);
      setStartDate(formatDate(m));
      setEndDate(nowStr);
    }
    setCurrentPage(1);
  };

  // Toggle single Reys checkbox
  const toggleReysCheckbox = (code: string) => {
    if (selectedReysCodes.includes(code)) {
      setSelectedReysCodes(selectedReysCodes.filter((c) => c !== code));
    } else {
      setSelectedReysCodes([...selectedReysCodes, code]);
    }
    setCurrentPage(1);
  };

  // Toggle All Checkboxes
  const toggleAllCheckboxes = () => {
    if (selectedReysCodes.length === cargoReyslar.length) {
      setSelectedReysCodes([]);
    } else {
      setSelectedReysCodes(cargoReyslar.map((r) => r.code));
    }
    setCurrentPage(1);
  };

  // Checkbox dropdown item search filter
  const checkboxFilteredReys = cargoReyslar.filter((r) =>
    r.code.toLowerCase().includes(checkboxSearchQuery.toLowerCase())
  );

  // Main Filter Logic: Date Range + Checkbox Filter + Main Search Bar
  const filteredReys = useMemo(() => {
    return cargoReyslar.filter((r) => {
      // 1. Text Search matching
      const matchesSearch = r.code.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Excel-Style Checkbox selection matching
      const matchesCheckbox = selectedReysCodes.includes(r.code);
      if (!matchesCheckbox) return false;

      // 3. Date Range matching (if set)
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      return true;
    });
  }, [cargoReyslar, searchQuery, selectedReysCodes, startDate, endDate]);

  // Aggregate metrics for filtered data
  const totalFilteredToza = useMemo(
    () => filteredReys.reduce((sum, r) => sum + r.toza_kg, 0),
    [filteredReys]
  );
  const totalFilteredKarobka = useMemo(
    () => filteredReys.reduce((sum, r) => sum + r.karobka_plus_kg, 0),
    [filteredReys]
  );

  // Pagination & Collapse logic
  const totalPages = Math.ceil(filteredReys.length / ITEMS_PER_PAGE) || 1;
  const paginatedReys = filteredReys.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const visibleReys = isExpanded ? paginatedReys : filteredReys.slice(0, 3);
  const hasMore = filteredReys.length > 3;

  // Execute Excel Export strictly based on currently applied filters
  const handleDownloadExcel = () => {
    if (filteredReys.length === 0) {
      alert("Xatolik: Filtr bo'yicha hech qanday reys tanlanmagan!");
      return;
    }

    const reysCodesList = filteredReys.map((r) => r.code).join(", ");
    const dateRangeInfo = startDate || endDate ? `\nSana oralig'i: ${startDate || 'Boshidan'} — ${endDate || 'Hozirgacha'}` : "\nSana: Barcha davr";

    alert(
      `📊 ${cargo?.code || ''} — FILTRLANGAN EXCEL HISOBOTI YUKLANMOQDA\n` +
      `-----------------------------------------\n` +
      `• Filtrlangan reyslar soni: ${filteredReys.length} ta\n` +
      `• Tanlangan reyslar: ${reysCodesList}\n` +
      `• Jami Toza vazn: ${totalFilteredToza.toLocaleString()} kg\n` +
      `• Jami karobka plus: ${totalFilteredKarobka.toLocaleString()} kg` +
      dateRangeInfo
    );
    setShowExcelExportModal(false);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-muted-foreground border border-dashed border-border rounded-3xl my-8">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        Kargo ma'lumotlari yuklanmoqda...
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="p-16 text-center text-muted-foreground space-y-4 border border-dashed border-border rounded-3xl my-8">
        <AlertTriangle className="h-10 w-10 mx-auto text-amber-400" />
        <h2 className="text-lg font-bold text-foreground">Kargo topilmadi</h2>
        <p className="text-xs text-muted-foreground">Ushbu kargo mavjud emas yoki o'chirilgan.</p>
        <Link to="/reports/cargos" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold">
          <ArrowLeft className="h-4 w-4" />
          <span>Kargolar ro'yxatiga qaytish</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      
      {/* Top Header with Excel Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Excel Export Button in Header — Shows live count of filtered trips */}
        <button
          onClick={() => setShowExcelExportModal(true)}
          className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-95"
          title="Filtrlangan reyslar bo'yicha Excel hisobot yuklash"
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Filtrlangan Excel ({filteredReys.length} ta reys)</span>
        </button>
      </div>

      {/* MOBILE COLLAPSIBLE TOGGLE BAR (Visible on Mobile Only) */}
      <div className="block md:hidden space-y-2">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card shadow-sm glass-panel transition-colors hover:bg-muted/30"
        >
          <div className="flex items-center space-x-2.5">
            <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-foreground">Filtrlar va Qidiruv</span>
            {isFilterActive && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
            )}
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-medium">
            <span>{isMobileFiltersOpen ? "Yopish" : "Ochish"}</span>
            {isMobileFiltersOpen ? (
              <ChevronUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-emerald-400" />
            )}
          </div>
        </button>

        {/* Quick Active Filter Indicator on Mobile when Collapsed */}
        {!isMobileFiltersOpen && isFilterActive && (
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-xs text-emerald-400">
            <span className="font-semibold">⚡ Filtr qo'llanilgan ({filteredReys.length} ta reys)</span>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-rose-400 font-bold underline text-[11px] hover:text-rose-300"
            >
              Tozalash
            </button>
          </div>
        )}
      </div>

      {/* FILTER CONTROL BAR: Date Filters & Excel-Style Checkbox Dropdown (Always visible on Desktop, Collapsible on Mobile) */}
      <div className={`${isMobileFiltersOpen ? "block" : "hidden md:block"} rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4 glass-panel transition-all`}>
        
        {/* Date Filter & Shortcuts & Clear Filters Button */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Sana bo'yicha filter:</span>
            </div>

            {/* Quick Shortcuts & "Filterni tozalash" Button */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: "Barchasi" },
                { key: "today", label: "Bugun" },
                { key: "yesterday", label: "Kecha" },
                { key: "week", label: "1 haftalik" },
                { key: "month", label: "1 oylik" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleDateShortcut(item.key as any)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border ${
                    activeDateShortcut === item.key
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm"
                      : "bg-background/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              {/* CLEAR ALL FILTERS BUTTON (Visible / Active when any filter is set) */}
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center space-x-1 rounded-lg px-2.5 py-1 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all shadow-sm active:scale-95 ml-1"
                  title="Barcha filtrlarni tozalash"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Filterni tozalash</span>
                </button>
              )}
            </div>
          </div>

          {/* Date Picker Range Inputs (Dan - Gacha) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center space-x-2 bg-background/50 border border-input rounded-xl px-3 py-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Dan:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDateShortcut("custom");
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent text-xs text-foreground focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 bg-background/50 border border-input rounded-xl px-3 py-1.5">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Gacha:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDateShortcut("custom");
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Search Input & Excel-Style Multi-Select Checkbox Dropdown Trigger */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
          
          {/* Main Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Reys kodi bo'yicha qidirish..."
              className="w-full rounded-xl border border-input bg-background/50 pl-10 pr-4 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Excel-Style Reys Multi-Select Checkbox Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReysCheckboxDropdown(!showReysCheckboxDropdown)}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-background/50 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center space-x-2 truncate">
                <ListFilter className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">Reyslar filtri ({selectedReysCodes.length}/{cargo.reyslar.length})</span>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showReysCheckboxDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Excel-Style Dropdown Menu Popover */}
            {showReysCheckboxDropdown && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-2xl z-50 space-y-2.5 glass-panel">
                
                {/* Search input inside checkbox dropdown */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={checkboxSearchQuery}
                    onChange={(e) => setCheckboxSearchQuery(e.target.value)}
                    placeholder="Ro'yxatdan qidirish..."
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Master Toggle All Checkbox */}
                <div
                  onClick={toggleAllCheckboxes}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer border-b border-border/50 pb-2 text-xs font-bold text-foreground"
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                    selectedReysCodes.length === cargo.reyslar.length
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-border bg-background"
                  }`}>
                    {selectedReysCodes.length === cargo.reyslar.length && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span>(Barchasini tanlash)</span>
                </div>

                {/* Checkbox Items List */}
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                  {checkboxFilteredReys.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-muted-foreground">
                      Reys topilmadi
                    </div>
                  ) : (
                    checkboxFilteredReys.map((reys) => {
                      const isChecked = selectedReysCodes.includes(reys.code);
                      return (
                        <div
                          key={reys.id}
                          onClick={() => toggleReysCheckbox(reys.code)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                              isChecked
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-border bg-background"
                            }`}>
                              {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span className="font-mono font-medium text-foreground">{reys.code}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{reys.toza_kg.toLocaleString()} kg</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Actions: Clear & Done */}
                <div className="pt-1 border-t border-border flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReysCodes(cargo.reyslar.map((r) => r.code));
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Barchasini tiklash
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReysCheckboxDropdown(false)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Tayyor
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* REYS CARDS GRID */}
      <div className="space-y-6">
        {filteredReys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground space-y-3">
            <p>Tanlangan filtrlar va qidiruv bo'yicha hech qanday reys topilmadi.</p>
            <button
              onClick={handleClearAllFilters}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Filterni tozalash</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visibleReys.map((reys) => (
                <ReysCard key={reys.id} reys={reys} />
              ))}
            </div>

            {/* Collapse / Expand Toggle Button */}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center space-x-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
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

            {/* Pagination Bar (Active when expanded and total pages > 1) */}
            {isExpanded && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                <span className="text-muted-foreground">
                  Sahifa <strong className="text-foreground">{currentPage}</strong> / {totalPages} (Jami {filteredReys.length} ta reys)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* EXCEL EXPORT MODAL STRICTLY REFLECTING THE APPLIED FILTERS */}
      {showExcelExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl space-y-5 glass-panel">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center space-x-2.5 text-emerald-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Filtrlangan Excel Hisoboti</h3>
                  <p className="text-xs text-muted-foreground">{cargo.code} — Aynan tanlangan filtrlar bo'yicha eksport</p>
                </div>
              </div>
              <button onClick={() => setShowExcelExportModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filtered Data Summary Preview */}
            <div className="space-y-3 rounded-2xl bg-background/60 p-4 border border-border text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center space-x-1.5">
                  <Filter className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Filtrlangan reyslar soni:</span>
                </span>
                <strong className="text-foreground text-sm font-mono">{filteredReys.length} ta reys</strong>
              </div>

              {/* List of included Reys codes */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">Excel fayliga kiritiladigan reyslar:</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {filteredReys.length === 0 ? (
                    <span className="text-rose-400 font-semibold">Hech qanday reys tanlanmagan</span>
                  ) : (
                    filteredReys.map((r) => (
                      <span key={r.id} className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                        {r.code}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Weight sums */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Jami Toza:</span>
                  <strong className="text-foreground">{totalFilteredToza.toLocaleString()} kg</strong>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Jami karobka plus:</span>
                  <strong className="text-emerald-400">{totalFilteredKarobka.toLocaleString()} kg</strong>
                </div>
              </div>

              {/* Active Date Range Display */}
              <div className="pt-1 text-[11px] text-muted-foreground">
                <span>Davr: </span>
                <strong className="text-foreground">
                  {startDate || endDate ? `${startDate || 'Boshidan'} dan ${endDate || 'Hozirgacha'}` : 'Barcha davr (Filtrsiz)'}
                </strong>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowExcelExportModal(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={filteredReys.length === 0}
                className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Shu filtrlarni Excel yuklash ({filteredReys.length})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
