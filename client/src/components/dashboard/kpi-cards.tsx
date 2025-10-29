import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DashboardFilters } from "@/pages/dashboard";

interface KPICardsProps {
  calls: Array<Doc<"carrier_calls">>;
  filters: DashboardFilters;
}

export function KPICards({ calls }: KPICardsProps) {
  // Calculate KPIs
  const totalCalls = calls.length;
  
  const wonCalls = calls.filter((c) => c.outcome === "won_transferred").length;
  const winRate = totalCalls > 0 ? (wonCalls / totalCalls) * 100 : 0;
  
  const avgRounds =
    totalCalls > 0
      ? calls.reduce((sum, c) => sum + c.negotiation_rounds, 0) / totalCalls
      : 0;
  
  const priceDisagreements = calls.filter(
    (c) => c.outcome === "no_agreement_price"
  ).length;
  const pctPriceDisagreements =
    totalCalls > 0 ? (priceDisagreements / totalCalls) * 100 : 0;
  
  const noFitCalls = calls.filter((c) => c.outcome === "no_fit_found").length;
  const pctNoFit = totalCalls > 0 ? (noFitCalls / totalCalls) * 100 : 0;
  
  const avgSentiment =
    totalCalls > 0
      ? calls.reduce((sum, c) => sum + c.sentiment_score, 0) / totalCalls
      : 0;

  // Helper to get win rate color
  const getWinRateColor = (rate: number) => {
    if (rate >= 35) return "text-green-600";
    if (rate >= 25) return "text-amber-600";
    return "text-red-600";
  };

  // Helper to get sentiment emoji
  const getSentimentEmoji = (score: number) => {
    if (score >= 1) return "😊";
    if (score >= 0.5) return "🙂";
    if (score >= 0) return "😐";
    if (score >= -0.5) return "😕";
    return "😞";
  };

  const kpis = [
    {
      label: "Total Calls",
      value: totalCalls.toLocaleString(),
      delta: null,
      color: "text-stone-900",
    },
    {
      label: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      delta: null,
      color: getWinRateColor(winRate),
    },
    {
      label: "Avg Rounds",
      value: avgRounds.toFixed(1),
      delta: null,
      color: "text-stone-900",
    },
    {
      label: "% Price Loss",
      value: `${pctPriceDisagreements.toFixed(1)}%`,
      delta: null,
      color: "text-stone-900",
    },
    {
      label: "% No Fit",
      value: `${pctNoFit.toFixed(1)}%`,
      delta: null,
      color: "text-stone-900",
    },
    {
      label: "Sentiment",
      value: `${avgSentiment.toFixed(2)} ${getSentimentEmoji(avgSentiment)}`,
      delta: null,
      color: avgSentiment >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi, index) => (
        <Card key={index} className="border-stone-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-stone-600">
                {kpi.label}
              </span>
              <span className={`mt-2 text-2xl font-semibold tracking-tight ${kpi.color}`}>
                {kpi.value}
              </span>
              {kpi.delta !== null && (
                <div className="mt-1 flex items-center text-xs">
                  {kpi.delta > 0 ? (
                    <TrendingUp className="mr-1 size-3 text-green-600" />
                  ) : kpi.delta < 0 ? (
                    <TrendingDown className="mr-1 size-3 text-red-600" />
                  ) : (
                    <Minus className="mr-1 size-3 text-stone-400" />
                  )}
                  <span
                    className={
                      kpi.delta > 0
                        ? "text-green-600"
                        : kpi.delta < 0
                        ? "text-red-600"
                        : "text-stone-400"
                    }
                  >
                    {kpi.delta > 0 ? "+" : ""}
                    {kpi.delta}%
                  </span>
                  <span className="ml-1 text-stone-500">vs prev</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
