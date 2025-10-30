import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRange = "today" | "last7" | "thisWeek" | "last30" | "custom";

export interface TopFiltersState {
  dateRange: DateRange;
  equipment: string;
  agent: string;
  outcome: string;
}

interface TopFiltersProps {
  filters: TopFiltersState;
  setFilters: (filters: TopFiltersState) => void;
  agents: string[];
  isLoading?: boolean;
}

export function AcmeTopFilters({
  filters,
  setFilters,
  agents,
  isLoading = false,
}: TopFiltersProps) {

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range */}
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="dateRange" className="sr-only">
            Date Range
          </label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) =>
              setFilters({ ...filters, dateRange: value as DateRange })
            }
            disabled={isLoading}
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
            onValueChange={(value) => setFilters({ ...filters, equipment: value })}
            disabled={isLoading}
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
            disabled={isLoading}
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
            onValueChange={(value) => setFilters({ ...filters, outcome: value })}
            disabled={isLoading}
          >
            <SelectTrigger id="outcome" aria-label="Select outcome">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="won_transferred">Won</SelectItem>
              <SelectItem value="no_agreement_price">Lost (Price)</SelectItem>
              <SelectItem value="no_fit_found">Lost (No Fit)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
