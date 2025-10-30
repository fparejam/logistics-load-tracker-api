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


interface OutcomeBreakdownData {
  won_transferred: number;
  no_agreement_price: number;
  no_fit_found: number;
  total: number;
}

interface WinsSegmentedData {
  low_uplift_wins: number; // ≤10% uplift (better deals)
  high_uplift_wins: number; // >10% uplift (less ideal)
  total_wins: number;
}

interface WinsLossesChartProps {
  data: OutcomeBreakdownData | undefined;
  winsSegmented: WinsSegmentedData | undefined;
  isLoading: boolean;
}

const COLORS = {
  won_transferred: '#10b981', // Green
  no_agreement_price: '#f59e0b', // Amber/Orange
  no_fit_found: '#eab308', // Yellow
};

const LABELS = {
  won_transferred: 'Won',
  no_agreement_price: 'Price Disagreement',
  no_fit_found: 'No Fit',
};

export function WinsLossesChart({ data, winsSegmented, isLoading }: WinsLossesChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Call Outcomes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No call data available for the selected filters
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate losses (all non-won outcomes)
  const losses = data.no_agreement_price + data.no_fit_found;
  
  // Get segmented wins data (default to 0 if not loaded)
  // Lower uplift is BETTER (negotiated down more, paid less)
  const lowUpliftWins = winsSegmented?.low_uplift_wins ?? 0; // ≤10% uplift - better deals
  const highUpliftWins = winsSegmented?.high_uplift_wins ?? 0; // >10% uplift - less ideal

  // Prepare data for Chart.js horizontal stacked bars
  // Bar 1: Lost vs Won (switched order - losses first)
  // Bar 2: Full breakdown (Price Disagreement + No Fit + Low Uplift Wins + High Uplift Wins - losses first)
  // Bar 3: Detailed breakdown (Price Disagreement + No Fit - losses only, more explainability)
  const chartData = {
    labels: ['Lost vs Won', 'Full Breakdown', 'Losses Breakdown'],
    datasets: [
      {
        label: 'Lost',
        data: [losses, 0, 0], // Show combined losses in first bar only
        backgroundColor: '#ef4444', // Red for losses
        borderColor: '#ef4444',
        borderWidth: 0,
      },
      {
        label: LABELS.won_transferred,
        data: [data.won_transferred, 0, 0], // Show in first bar only
        backgroundColor: COLORS.won_transferred,
        borderColor: COLORS.won_transferred,
        borderWidth: 0,
      },
      {
        label: LABELS.no_agreement_price,
        data: [0, data.no_agreement_price, 0],
        backgroundColor: COLORS.no_agreement_price,
        borderColor: COLORS.no_agreement_price,
        borderWidth: 0,
      },
      {
        label: LABELS.no_fit_found,
        data: [0, data.no_fit_found, 0],
        backgroundColor: COLORS.no_fit_found,
        borderColor: COLORS.no_fit_found,
        borderWidth: 0,
      },
      {
        label: 'Low Uplift Wins (≤10%)',
        data: [0, lowUpliftWins, 0], // Show in second bar only - better deals
        backgroundColor: '#059669', // Darker green for better negotiations
        borderColor: '#059669',
        borderWidth: 0,
      },
      {
        label: 'High Uplift Wins (>10%)',
        data: [0, highUpliftWins, 0], // Show in second bar only - less ideal
        backgroundColor: '#34d399', // Lighter green for less ideal
        borderColor: '#34d399',
        borderWidth: 0,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const, // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          color: '#6b7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const value = context.parsed.x;
            const total = data.total;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.dataset.label}: ${value.toLocaleString()} (${percentage}%)`;
          },
          afterBody: function () {
            return `Total: ${data.total.toLocaleString()}`;
          },
        },
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          callback: function (value: any) {
            return typeof value === 'number' ? value.toLocaleString() : value;
          },
        },
        grid: {
          color: '#e5e7eb',
          drawBorder: false,
        },
      },
      y: {
        stacked: true,
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
        },
        grid: {
          display: true,
          color: '#e5e7eb',
          drawBorder: false,
          lineWidth: 1,
        },
      },
    },
  };

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm bg-white flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Call Outcomes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 w-full min-h-0">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}

