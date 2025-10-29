import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";

interface MoneyCardsProps {
  calls: Array<Doc<"carrier_calls">>;
}

export function MoneyCards({ calls }: MoneyCardsProps) {
  // Filter calls with rates
  const callsWithRates = calls.filter(
    (c) => c.listed_rate !== undefined && c.final_rate !== undefined
  );

  const avgListed =
    callsWithRates.length > 0
      ? callsWithRates.reduce((sum, c) => sum + (c.listed_rate || 0), 0) /
        callsWithRates.length
      : 0;

  const avgFinal =
    callsWithRates.length > 0
      ? callsWithRates.reduce((sum, c) => sum + (c.final_rate || 0), 0) /
        callsWithRates.length
      : 0;

  const avgUplift =
    avgListed > 0 ? ((avgFinal - avgListed) / avgListed) * 100 : 0;

  // Helper to get uplift color
  const getUpliftColor = (uplift: number) => {
    const absUplift = Math.abs(uplift);
    if (absUplift <= 5) return "text-green-600";
    if (absUplift <= 10) return "text-amber-600";
    return "text-red-600";
  };

  const moneyMetrics = [
    {
      label: "Avg Listed",
      value: `$${avgListed.toFixed(0)}`,
      color: "text-stone-900",
    },
    {
      label: "Avg Final",
      value: `$${avgFinal.toFixed(0)}`,
      color: "text-stone-900",
    },
    {
      label: "Avg Uplift",
      value: `${avgUplift >= 0 ? "+" : ""}${avgUplift.toFixed(1)}%`,
      color: getUpliftColor(avgUplift),
    },
  ];

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      {moneyMetrics.map((metric, index) => (
        <Card key={index} className="border-stone-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-stone-600">
                {metric.label}
              </span>
              <span className={`mt-2 text-xl font-semibold tracking-tight ${metric.color}`}>
                {metric.value}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
