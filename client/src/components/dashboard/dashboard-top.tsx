

import { AcmeTopFilters, TopFiltersState } from "./acme-top-filters";
import { AcmeKpiRow } from "./acme-kpi-row";
import { WinsLossesAgSankey } from "./wins-losses-ag-sankey";
import { AgentComparisonChart } from "./agent-comparison-chart";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function DashboardTop() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState<TopFiltersState>(() => {
    return {
      dateRange: (searchParams.get("dateRange") as TopFiltersState["dateRange"]) || "allTime",
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
    // If "allTime" is selected, don't apply date filters
    if (filters.dateRange === "allTime") {
      return {
        startDate: undefined,
        endDate: undefined,
      };
    }

    const now = new Date();
    let start: Date;
    // End date should be end of today (23:59:59.999) to include all calls from today
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (filters.dateRange) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case "last7":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case "thisWeek":
        const dayOfWeek = now.getDay();
        start = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case "last30":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case "custom":
        // For now, default to last 7 days for custom
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
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

  const outcomeBreakdown = useQuery(api.call_metrics.getOutcomeBreakdown, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome_tag: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const winsSegmented = useQuery(api.call_metrics.getWinsSegmented, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome_tag: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const agentMetrics = useQuery(api.call_metrics.getAgentMetrics, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome_tag: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const priceDisagreementBreakdown = useQuery(api.call_metrics.getPriceDisagreementBreakdown, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome_tag: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const noFitBreakdown = useQuery(api.call_metrics.getNoFitBreakdown, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome_tag: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const agents = useQuery(api.call_metrics.getAgents);

  const isLoading = data === undefined || agents === undefined || outcomeBreakdown === undefined || winsSegmented === undefined || agentMetrics === undefined || priceDisagreementBreakdown === undefined || noFitBreakdown === undefined;

  return (
    <div className="w-full">
      {/* Spacer for header height */}
      <div className="h-12" />
      
      {/* Sticky Filters Container - positioned below header */}
      <div className="sticky top-15 z-40 bg-white -mt-12">
        <AcmeTopFilters
          filters={filters}
          setFilters={setFilters}
          agents={agents || []}
          isLoading={isLoading}
        />
      </div>

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

      {/* KPI Section - All 9 Metrics */}
      <div className="mt-4">
        <AcmeKpiRow data={data} isLoading={isLoading} />
      </div>

      {/* Detailed Analysis Section - Charts (stacked) */}
      <div className="mt-4 grid grid-cols-1 gap-4 items-stretch">
        {/* Wins/Losses Sankey (AG Charts) - Top Left */}
        <WinsLossesAgSankey
          outcome={outcomeBreakdown}
          wins={winsSegmented}
          priceDisagreement={priceDisagreementBreakdown}
          noFit={noFitBreakdown}
          isLoading={isLoading}
        />
        
        {/* Agent Performance Comparison */}
        <AgentComparisonChart data={agentMetrics} isLoading={isLoading} />
      </div>
    </div>
  );
}

// Export types for external use
export type { TopFiltersState } from "./acme-top-filters";
