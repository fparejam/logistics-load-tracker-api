import { DashboardFilters as Filters } from "@/pages/dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardFiltersProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  agents: string[];
}

export function DashboardFilters({
  filters,
  setFilters,
  agents,
}: DashboardFiltersProps) {

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="dateRange" className="sr-only">
            Date Range
          </label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) =>
              setFilters({ ...filters, dateRange: value as Filters["dateRange"] })
            }
          >
            <SelectTrigger id="dateRange" aria-label="Select date range">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last7">Last 7 Days</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="last30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Equipment */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="equipment" className="sr-only">
            Equipment Type
          </label>
          <Select
            value={filters.equipment}
            onValueChange={(value) =>
              setFilters({ ...filters, equipment: value })
            }
          >
            <SelectTrigger id="equipment" aria-label="Select equipment type">
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              <SelectItem value="dry_van">Dry Van</SelectItem>
              <SelectItem value="reefer">Reefer</SelectItem>
              <SelectItem value="flatbed">Flatbed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agent */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="agent" className="sr-only">
            Agent
          </label>
          <Select
            value={filters.agent}
            onValueChange={(value) => setFilters({ ...filters, agent: value })}
          >
            <SelectTrigger id="agent" aria-label="Select agent">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Outcome */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="outcome" className="sr-only">
            Outcome
          </label>
          <Select
            value={filters.outcome}
            onValueChange={(value) =>
              setFilters({ ...filters, outcome: value })
            }
          >
            <SelectTrigger id="outcome" aria-label="Select outcome">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="won_transferred">Won</SelectItem>
              <SelectItem value="no_agreement_price">Lost - Price</SelectItem>
              <SelectItem value="no_fit_found">No Fit</SelectItem>
              <SelectItem value="ineligible">Ineligible</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applied Filters Pills */}
      {(filters.equipment !== "all" ||
        filters.agent !== "all" ||
        filters.outcome !== "all") && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-stone-600">Applied filters:</span>
          {filters.equipment !== "all" && (
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">
              {filters.equipment.replace("_", " ")}
            </span>
          )}
          {filters.agent !== "all" && (
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">
              {filters.agent}
            </span>
          )}
          {filters.outcome !== "all" && (
            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800">
              {filters.outcome.replace(/_/g, " ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
