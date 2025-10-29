import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { format } from "date-fns";

interface SentimentChartProps {
  calls: Array<Doc<"carrier_calls">>;
}

export function SentimentChart({ calls }: SentimentChartProps) {
  // Group calls by date and calculate average sentiment (always daily)
  const groupedData = calls.reduce((acc, call) => {
    const date = new Date(call.call_date);
    const key = format(date, "yyyy-MM-dd");

    if (!acc[key]) {
      acc[key] = {
        date: key,
        sentimentSum: 0,
        count: 0,
      };
    }

    acc[key].sentimentSum += call.sentiment_score;
    acc[key].count += 1;

    return acc;
  }, {} as Record<string, any>);

  // Convert to array and calculate averages
  const chartData = Object.values(groupedData)
    .map((day: any) => ({
      date: format(new Date(day.date), "MMM d"),
      sentiment: (day.sentimentSum / day.count).toFixed(2),
      count: day.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getSentimentLabel = (score: number) => {
    if (score > 0.1) return "positive";
    if (score < -0.1) return "negative";
    return "neutral";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sentiment = parseFloat(data.sentiment);
      const sentimentLabel = getSentimentLabel(sentiment);

      return (
        <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
          <p className="mb-2 font-medium text-stone-900">{data.date}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Avg Sentiment</span>
              <span
                className="font-medium capitalize"
                style={{
                  textTransform: "capitalize",
                  color:
                    sentimentLabel === "positive"
                      ? "#16a34a"
                      : sentimentLabel === "negative"
                      ? "#dc2626"
                      : "#6b7280",
                }}
              >
                {sentimentLabel}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-stone-600">Calls</span>
              <span className="font-medium">{data.count}</span>
            </div>
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
            Sentiment Trend
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
        <CardTitle className="text-base font-medium">Sentiment Trend</CardTitle>
        <p className="text-xs text-stone-600">
          Average sentiment score over time (−2 to +2)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fca5a5" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#fca5a5" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86efac" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#86efac" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716c" />
            <YAxis
              domain={[-2, 2]}
              ticks={[-2, -1, 0, 1, 2]}
              tick={{ fontSize: 12 }}
              stroke="#78716c"
              label={{
                value: "Sentiment",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12 },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Reference lines for sentiment zones */}
            <ReferenceLine y={0} stroke="#78716c" strokeDasharray="3 3" />
            
            {/* Sentiment line */}
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        {/* Legend for sentiment zones */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-red-300" />
            <span className="text-stone-600">Negative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-stone-300" />
            <span className="text-stone-600">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-green-300" />
            <span className="text-stone-600">Positive</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
