/**
 * DashboardTop - ACME Dashboard Top Section
 * 
 * This component renders the top section of the ACME Dashboard including:
 * - TopFilters: Date range, Equipment, Agent, Outcome, Granularity controls
 * - KpiRow: 6 KPI cards (Total Calls, Win Rate, Avg Rounds, % Price Disagreements, % No Fit, Sentiment)
 * - MoneyRow: 3 financial cards (Avg Listed, Avg Final, Avg Uplift %)
 * 
 * Features:
 * - Accessible (WCAG AA): labels, keyboard focus, aria-live on loading
 * - URL persistence: filters saved to query string for shareable links
 * - Responsive: mobile-friendly layout
 * - Loading states: skeleton loaders while fetching data
 */

import { AcmeTopFilters, TopFiltersState } from "./acme-top-filters";
import { AcmeKpiRow } from "./acme-kpi-row";
import { AcmeMoneyRow } from "./acme-money-row";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function DashboardTop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState<TopFiltersState>(() => {
    return {
      dateRange: (searchParams.get("dateRange") as TopFiltersState["dateRange"]) || "last7",
      equipment: searchParams.get("equipment") || "all",
      agent: searchParams.get("agent") || "all",
      outcome: searchParams.get("outcome") || "all",
    };
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams({
      dateRange: filters.dateRange,
      equipment: filters.equipment,
      agent: filters.agent,
      outcome: filters.outcome,
      // granularity removed from URL - always defaults to "daily"
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (filters.dateRange) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "last7":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "thisWeek":
        const dayOfWeek = now.getDay();
        start = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        break;
      case "last30":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "custom":
        // For now, default to last 7 days for custom
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [filters.dateRange]);

  // Fetch data
  const data = useQuery(api.call_metrics.getSummary, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome_tag: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const agents = useQuery(api.call_metrics.getAgents);

  const isLoading = data === undefined || agents === undefined;

  return (
    <div className="w-full">
      {/* Filters */}
      <AcmeTopFilters
        filters={filters}
        setFilters={setFilters}
        agents={agents || []}
        isLoading={isLoading}
      />

      {/* Loading announcement for screen readers */}
      {isLoading && (
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Loading dashboard data...
        </div>
      )}

      {/* KPI Cards */}
      <AcmeKpiRow data={data} isLoading={isLoading} />

      {/* Money Cards */}
      <AcmeMoneyRow data={data} isLoading={isLoading} />
    </div>
  );
}

// Export types for external use
export type { TopFiltersState } from "./acme-top-filters";
