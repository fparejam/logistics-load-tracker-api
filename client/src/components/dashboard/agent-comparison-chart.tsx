import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AgentMetric {
  agent_name: string;
  total_calls: number;
  win_rate: number;
  avg_negotiation_rounds: number;
  avg_sentiment_score: number;
  avg_uplift_pct: number;
}

interface AgentComparisonChartProps {
  data: AgentMetric[] | undefined;
  isLoading: boolean;
}

export function AgentComparisonChart({ data, isLoading }: AgentComparisonChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Agent Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            No agent data available for the selected filters
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort agents alphabetically for consistency
  const sortedData = [...data].sort((a, b) => a.agent_name.localeCompare(b.agent_name));
  const agentNames = sortedData.map((d) => d.agent_name);

  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 8,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
      },
    },
  };

  // Chart 1: Win Rate
  const winRateData = {
    labels: agentNames,
    datasets: [
      {
        label: 'Win Rate',
        data: sortedData.map((d) => d.win_rate * 100),
        backgroundColor: '#10b981', // Green
        borderColor: '#10b981',
        borderWidth: 0,
      },
    ],
  };

  // Chart 2: Average Negotiation Rounds
  const roundsData = {
    labels: agentNames,
    datasets: [
      {
        label: 'Avg Negotiation Rounds',
        data: sortedData.map((d) => d.avg_negotiation_rounds),
        backgroundColor: '#3b82f6', // Blue
        borderColor: '#3b82f6',
        borderWidth: 0,
      },
    ],
  };

  // Chart 3: Average Sentiment Score
  const sentimentData = {
    labels: agentNames,
    datasets: [
      {
        label: 'Avg Sentiment Score',
        data: sortedData.map((d) => d.avg_sentiment_score),
        backgroundColor: '#8b5cf6', // Purple
        borderColor: '#8b5cf6',
        borderWidth: 0,
      },
    ],
  };

  // Chart 4: Average Uplift % (lower is better)
  const upliftData = {
    labels: agentNames,
    datasets: [
      {
        label: 'Avg Uplift %',
        data: sortedData.map((d) => d.avg_uplift_pct),
        backgroundColor: '#f59e0b', // Amber/Orange
        borderColor: '#f59e0b',
        borderWidth: 0,
      },
    ],
  };

  const charts = [
    {
      title: 'Win Rate',
      subtitle: 'Higher is better',
      data: winRateData,
      formatValue: (value: number) => `${value.toFixed(1)}%`,
      color: '#10b981',
    },
    {
      title: 'Avg Negotiation Rounds',
      subtitle: 'Lower is more efficient',
      data: roundsData,
      formatValue: (value: number) => value.toFixed(1),
      color: '#3b82f6',
    },
    {
      title: 'Avg Sentiment Score',
      subtitle: 'Higher is better',
      data: sentimentData,
      formatValue: (value: number) => value.toFixed(2),
      color: '#8b5cf6',
    },
    {
      title: 'Avg Uplift %',
      subtitle: 'Lower is better',
      data: upliftData,
      formatValue: (value: number) => `${value.toFixed(1)}%`,
      color: '#f59e0b',
    },
  ];

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm bg-white flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Agent Performance Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {charts.map((chart, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{chart.title}</h4>
                  <p className="text-xs text-gray-500">{chart.subtitle}</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <Bar
                  data={chart.data}
                  options={{
                    ...commonOptions,
                    plugins: {
                      ...commonOptions.plugins,
                      tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                          label: function (context: any) {
                            return `${chart.formatValue(context.parsed.y)}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

