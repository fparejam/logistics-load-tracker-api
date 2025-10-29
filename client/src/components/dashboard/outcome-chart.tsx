import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface OutcomeChartProps {
  calls: Array<Doc<"carrier_calls">>;
}

export function OutcomeChart({ calls }: OutcomeChartProps) {
  // Group calls by date (always daily)
  const groupedData = calls.reduce((acc, call) => {
    const date = new Date(call.call_date);
    const key = format(date, "yyyy-MM-dd");

    if (!acc[key]) {
      acc[key] = {
        date: key,
        won_transferred: 0,
        no_agreement_price: 0,
        no_fit_found: 0,
        ineligible: 0,
        other: 0,
        total: 0,
      };
    }

    acc[key][call.outcome as keyof typeof acc[typeof key]] =
      (acc[key][call.outcome as keyof typeof acc[typeof key]] as number) + 1;
    acc[key].total += 1;

    return acc;
  }, {} as Record<string, any>);

  // Convert to array and calculate percentages
  const chartData = Object.values(groupedData)
    .map((day: any) => ({
      date: format(new Date(day.date), "MMM d"),
      Won: ((day.won_transferred / day.total) * 100).toFixed(1),
      "Price Loss": ((day.no_agreement_price / day.total) * 100).toFixed(1),
      "No Fit": ((day.no_fit_found / day.total) * 100).toFixed(1),
      Ineligible: ((day.ineligible / day.total) * 100).toFixed(1),
      Other: ((day.other / day.total) * 100).toFixed(1),
      // Store raw counts for tooltip
      wonCount: day.won_transferred,
      priceCount: day.no_agreement_price,
      noFitCount: day.no_fit_found,
      ineligibleCount: day.ineligible,
      otherCount: day.other,
      totalCount: day.total,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
          <p className="mb-2 font-medium text-stone-900">{data.date}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500" />
                Won
              </span>
              <span className="font-medium">
                {data.wonCount} ({data.Won}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500" />
                Price Loss
              </span>
              <span className="font-medium">
                {data.priceCount} ({data["Price Loss"]}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500" />
                No Fit
              </span>
              <span className="font-medium">
                {data.noFitCount} ({data["No Fit"]}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-stone-400" />
                Ineligible
              </span>
              <span className="font-medium">
                {data.ineligibleCount} ({data.Ineligible}%)
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-stone-300" />
                Other
              </span>
              <span className="font-medium">
                {data.otherCount} ({data.Other}%)
              </span>
            </div>
          </div>
          <div className="mt-2 border-t border-stone-200 pt-2">
            <span className="text-xs font-medium text-stone-600">
              Total: {data.totalCount} calls
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Outcome Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-sm text-stone-500">
            No calls in selected range
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Outcome Breakdown
        </CardTitle>
        <p className="text-xs text-stone-600">
          Daily call outcomes as percentage of total
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#78716c"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#78716c"
              label={{ value: "% of Calls", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              iconType="circle"
            />
            <Bar dataKey="Won" stackId="a" fill="#16a34a" />
            <Bar dataKey="Price Loss" stackId="a" fill="#f59e0b" />
            <Bar dataKey="No Fit" stackId="a" fill="#2563eb" />
            <Bar dataKey="Ineligible" stackId="a" fill="#a8a29e" />
            <Bar dataKey="Other" stackId="a" fill="#d6d3d1" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
