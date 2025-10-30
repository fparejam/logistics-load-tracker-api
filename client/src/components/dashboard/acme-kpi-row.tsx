import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPIData {
  total_calls: number;
  win_rate: number;
  avg_negotiation_rounds: number;
  pct_no_agreement_price: number;
  pct_no_fit_found: number;
  sentiment_score: number;
  avg_listed: number;
  avg_final: number;
  avg_uplift_pct: number;
}

interface AcmeKpiRowProps {
  data: KPIData | undefined;
  isLoading: boolean;
}

export function AcmeKpiRow({ data, isLoading }: AcmeKpiRowProps) {
  // Helper to get win rate badge color
  const getWinRateBadgeColor = (rate: number) => {
    const pct = rate * 100;
    if (pct >= 35) return "bg-green-100 text-green-700 border-green-200";
    if (pct >= 25) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  // Helper to get sentiment text label
  const getSentimentLabel = (score: number) => {
    if (score > 0.1) return "positive";
    if (score < -0.1) return "negative";
    return "neutral";
  };

  // Helper to get uplift color (spec says: green ≤5%, amber 5-10%, red >10%)
  const getUpliftColor = (upliftPct: number) => {
    const absUplift = Math.abs(upliftPct * 100);
    if (absUplift <= 5) return "text-green-600";
    if (absUplift <= 10) return "text-amber-600";
    return "text-red-600";
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const sentimentLabel = getSentimentLabel(data.sentiment_score);
  const sentimentColor =
    sentimentLabel === "positive"
      ? "text-green-600"
      : sentimentLabel === "negative"
      ? "text-red-600"
      : "text-gray-600";

  // Split KPIs into two rows: main metrics (6) and financial metrics (3)
  const mainKpis = [
    {
      label: "Total Calls",
      value: data.total_calls.toLocaleString(),
      delta: null,
      badge: null,
      tooltip: null,
    },
    {
      label: "Win Rate",
      value: `${(data.win_rate * 100).toFixed(1)}%`,
      delta: null,
      badge: (
        <Badge
          className={`mt-2 text-xs font-medium ${getWinRateBadgeColor(data.win_rate)}`}
        >
          {data.win_rate >= 0.35 ? "Good" : data.win_rate >= 0.25 ? "Fair" : "Low"}
        </Badge>
      ),
      tooltip: "Calls that resulted in successful bookings.",
    },
    {
      label: "Avg. Negotiation Rounds",
      value: data.avg_negotiation_rounds.toFixed(1),
      delta: null,
      badge: null,
      tooltip: "Average negotiation exchanges per call.",
    },
    {
      label: "% Price Disagreements",
      value: `${(data.pct_no_agreement_price * 100).toFixed(1)}%`,
      delta: null,
      badge: null,
      tooltip: "Calls lost due to price disagreements.",
    },
    {
      label: "% No Fit",
      value: `${(data.pct_no_fit_found * 100).toFixed(1)}%`,
      delta: null,
      badge: null,
      tooltip: "Calls with no suitable match found.",
    },
    {
      label: "Sentiment",
      value: (
        <span className={sentimentColor} style={{ textTransform: "capitalize" }}>
          {sentimentLabel}
        </span>
      ),
      delta: null,
      badge: null,
    },
  ];

  const financialKpis = [
    {
      label: "Avg Listed",
      value: `$${Math.round(data.avg_listed).toLocaleString()}`,
      delta: null,
      badge: null,
      tooltip: null,
      color: "text-gray-900",
    },
    {
      label: "Avg Final",
      value: `$${Math.round(data.avg_final).toLocaleString()}`,
      delta: null,
      badge: null,
      tooltip: null,
      color: "text-gray-900",
    },
    {
      label: "Avg Uplift %",
      value: `${data.avg_uplift_pct >= 0 ? "+" : ""}${(data.avg_uplift_pct * 100).toFixed(1)}%`,
      delta: null,
      badge: null,
      tooltip: "Difference between final negotiated and listed rates. The lower the better.",
      color: getUpliftColor(data.avg_uplift_pct),
    },
  ];

  const renderKpiCard = (kpi: typeof mainKpis[0], index: number) => {
    const delta = kpi.delta as number | null;
    return (
      <Card
        key={index}
        className="rounded-xl border border-gray-200 shadow-sm bg-white"
      >
        <CardContent className="p-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">{kpi.label}</span>
              {kpi.tooltip && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{kpi.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <span className={`mt-2 text-2xl font-semibold tracking-tight ${(kpi as any).color || "text-gray-900"}`}>
              {kpi.value}
            </span>
            {delta !== null && delta !== undefined && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                {delta > 0 ? (
                  <>
                    <TrendingUp className="size-3 text-green-600" />
                    <span className="text-green-600">
                      +{delta.toFixed(1)}%
                    </span>
                  </>
                ) : delta < 0 ? (
                  <>
                    <TrendingDown className="size-3 text-red-600" />
                    <span className="text-red-600">{delta.toFixed(1)}%</span>
                  </>
                ) : null}
              </div>
            )}
            {kpi.badge}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" role="region" aria-label="Key Performance Indicators">
      {/* Main KPI Row - 6 cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {mainKpis.map((kpi, index) => renderKpiCard(kpi, index))}
      </div>
      
      {/* Financial Metrics Row - 3 cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {financialKpis.map((kpi, index) => renderKpiCard(kpi, index + 6))}
      </div>
    </div>
  );
}
