import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MoneyData {
  avg_listed: number;
  avg_final: number;
  avg_uplift_pct: number;
}

interface AcmeMoneyRowProps {
  data: MoneyData | undefined;
  isLoading: boolean;
}

export function AcmeMoneyRow({ data, isLoading }: AcmeMoneyRowProps) {
  // Helper to get uplift color (spec says: green ≤5%, amber 5-10%, red >10%)
  const getUpliftColor = (upliftPct: number) => {
    const absUplift = Math.abs(upliftPct * 100);
    if (absUplift <= 5) return "text-green-600";
    if (absUplift <= 10) return "text-amber-600";
    return "text-red-600";
  };

  if (isLoading || !data) {
    return (
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="rounded-xl border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const moneyMetrics = [
    {
      label: "Avg Listed",
      value: `$${Math.round(data.avg_listed).toLocaleString()}`,
      color: "text-gray-900",
    },
    {
      label: "Avg Final",
      value: `$${Math.round(data.avg_final).toLocaleString()}`,
      color: "text-gray-900",
    },
    {
      label: "Avg Uplift %",
      value: `${data.avg_uplift_pct >= 0 ? "+" : ""}${(data.avg_uplift_pct * 100).toFixed(1)}%`,
      color: getUpliftColor(data.avg_uplift_pct),
    },
  ];

  return (
    <div
      className="mt-4 grid gap-4 sm:grid-cols-3"
      role="region"
      aria-label="Financial Metrics"
    >
      {moneyMetrics.map((metric, index) => (
        <Card
          key={index}
          className="rounded-xl border border-gray-200 shadow-sm bg-white"
        >
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">{metric.label}</span>
              <span
                className={`mt-2 text-2xl font-semibold tracking-tight ${metric.color}`}
              >
                {metric.value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
