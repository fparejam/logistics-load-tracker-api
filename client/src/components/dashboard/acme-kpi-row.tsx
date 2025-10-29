import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KPIData {
  total_calls: number;
  win_rate: number;
  avg_negotiation_rounds: number;
  pct_no_agreement_price: number;
  pct_no_fit_found: number;
  sentiment_score: number;
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

  if (isLoading || !data) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="rounded-xl border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
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

  const kpis = [
    {
      label: "Total Calls",
      value: data.total_calls.toLocaleString(),
      delta: null,
      badge: null,
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
    },
    {
      label: "Avg Rounds",
      value: data.avg_negotiation_rounds.toFixed(1),
      delta: null,
      badge: null,
    },
    {
      label: "% Price Disagreements",
      value: `${(data.pct_no_agreement_price * 100).toFixed(1)}%`,
      delta: null,
      badge: null,
    },
    {
      label: "% No Fit",
      value: `${(data.pct_no_fit_found * 100).toFixed(1)}%`,
      delta: null,
      badge: null,
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

  return (
    <div
      className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      role="region"
      aria-label="Key Performance Indicators"
    >
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className="rounded-xl border border-gray-200 shadow-sm bg-white"
        >
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{kpi.label}</span>
              <span className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                {kpi.value}
              </span>
              {kpi.delta && (
                <div className="mt-2 flex items-center gap-1 text-xs">
                  {kpi.delta > 0 ? (
                    <>
                      <TrendingUp className="size-3 text-green-600" />
                      <span className="text-green-600">
                        +{kpi.delta.toFixed(1)}%
                      </span>
                    </>
                  ) : kpi.delta < 0 ? (
                    <>
                      <TrendingDown className="size-3 text-red-600" />
                      <span className="text-red-600">{kpi.delta.toFixed(1)}%</span>
                    </>
                  ) : null}
                </div>
              )}
              {kpi.badge}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
