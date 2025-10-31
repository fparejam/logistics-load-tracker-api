import { Layout } from "@/components/layout";
import { LoadsMap } from "@/components/loads-map";
import { AcmeTopFilters, TopFiltersState } from "@/components/dashboard/acme-top-filters";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";

export default function AcmeMap() {
  // Debug
  if (typeof window !== 'undefined') {
    (window as any).__MAP_PAGE_DEBUG__ = { loaded: true, timestamp: new Date().toISOString() };
  }
  
  // Initialize filters with defaults (no outcome filter needed for map - only shows successful loads)
  const [filters, setFilters] = useState<TopFiltersState>({
    dateRange: "allTime",
    equipment: "all",
    agent: "all",
    outcome: "all", // Required by type but hidden from UI
  });

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

  // Get agents list
  const agents = useQuery(api.call_metrics.getAgents);

  return (
    <Layout>
      <div className="flex flex-col flex-1 w-full">
        <div className="flex-1 px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="mb-4 mt-2">
            <AcmeTopFilters
              filters={filters as TopFiltersState}
              setFilters={(newFilters) => {
                const { outcome, ...rest } = newFilters;
                setFilters(rest as typeof filters);
              }}
              agents={agents || []}
              isLoading={agents === undefined}
              hideOutcome={true}
            />
          </div>
          
          {/* Map */}
          <LoadsMap 
            className="mt-2" 
            height="80vh"
            filters={{
              startDate,
              endDate,
              equipment: filters.equipment !== "all" ? filters.equipment : undefined,
              agent_name: filters.agent !== "all" ? filters.agent : undefined,
              // No outcome_tag filter - map only shows successful loads
            }}
          />
        </div>
      </div>
    </Layout>
  );
}
