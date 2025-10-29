import { Layout } from "@/components/layout";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { MoneyCards } from "@/components/dashboard/money-cards";
import { OutcomeChart } from "@/components/dashboard/outcome-chart";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import { LanesMap } from "@/components/dashboard/lanes-map";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export type DateRange = "today" | "last7" | "thisWeek" | "last30" | "custom";
export type Granularity = "daily" | "weekly";

export interface DashboardFilters {
  dateRange: DateRange;
  customStartDate?: Date;
  customEndDate?: Date;
  equipment: string;
  agent: string;
  outcome: string;
  granularity: Granularity;
}

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: "last7",
    equipment: "all",
    agent: "all",
    outcome: "all",
    granularity: "daily",
  });

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
        start = filters.customStartDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = filters.customEndDate || now;
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: start.getTime(),
      endDate: end.getTime(),
    };
  }, [filters.dateRange, filters.customStartDate, filters.customEndDate]);

  // Fetch data
  const data = useQuery(api.carrier_calls.getAnalytics, {
    start_date: startDate,
    end_date: endDate,
    equipment_type: filters.equipment !== "all" ? filters.equipment : undefined,
    agent_name: filters.agent !== "all" ? filters.agent : undefined,
    outcome: filters.outcome !== "all" ? filters.outcome : undefined,
  });

  const agents = useQuery(api.carrier_calls.getAgents);

  if (data === undefined || agents === undefined) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner className="size-8" />
        </div>
      </Layout>
    );
  }

  const calls = data.calls;

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              ACME Logistics Dashboard
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Monitor inbound carrier calls and booking performance
            </p>
          </div>

          {/* Filters */}
          <DashboardFilters
            filters={filters}
            setFilters={setFilters}
            agents={agents}
          />

          {/* KPI Cards */}
          <KPICards calls={calls} filters={filters} />

          {/* Money Cards */}
          <MoneyCards calls={calls} />

          {/* Charts Row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <OutcomeChart calls={calls} granularity={filters.granularity} />
            <SentimentChart calls={calls} granularity={filters.granularity} />
          </div>

          {/* Map */}
          <div className="mt-6">
            <LanesMap calls={calls} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
