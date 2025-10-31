"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgCharts } from "ag-charts-react";
// @ts-ignore - enterprise module provides runtime only in local dev
import "ag-charts-enterprise";
// @ts-ignore - types may be absent in local dev without license typings
import { LicenseManager } from "ag-charts-enterprise";

// Bind AG Charts Enterprise license from env when available (local dev safe)
try {
  const key = (import.meta as any)?.env?.VITE_AG_CHARTS_LICENSE as string | undefined;
  if (key) {
    LicenseManager.setLicenseKey(key);
  }
} catch {
  // ignore in dev if env not present
}

interface OutcomeBreakdownData {
  won_transferred: number;
  no_agreement_price: number;
  no_fit_found: number;
  total: number;
}

interface WinsSegmentedData {
  low_uplift_wins: number;
  high_uplift_wins: number;
  total_wins: number;
}

interface PriceDisagreementBreakdownData {
  small_gap: number;
  medium_gap: number;
  large_gap: number;
  total: number;
}

interface NoFitBreakdownData {
  few_loads: number;
  multiple_loads: number;
  many_loads: number;
  total: number;
}

interface Props {
  outcome: OutcomeBreakdownData | undefined;
  wins: WinsSegmentedData | undefined;
  priceDisagreement: PriceDisagreementBreakdownData | undefined;
  noFit: NoFitBreakdownData | undefined;
  isLoading: boolean;
}

export function WinsLossesAgSankey({ outcome, wins, priceDisagreement, noFit, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white h-full">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="flex-1 h-full">
          <div className="h-full w-full flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!outcome || outcome.total === 0) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Call Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 h-full">
          <div className="flex items-center justify-center h-full text-gray-500">
            No call data available for the selected filters
          </div>
        </CardContent>
      </Card>
    );
  }

  const root = "Calls";
  const lost = "Lost";
  const won = "Won";
  const price = "Price Disagreement";
  const nofit = "No Fit";

  const data: Array<{ from: string; to: string; size: number }> = [];

  // Root → Won/Lost
  data.push({ from: root, to: won, size: outcome.won_transferred });
  const lostCount = outcome.no_agreement_price + outcome.no_fit_found;
  data.push({ from: root, to: lost, size: lostCount });

  // Won → Low/High uplift
  const lowU = wins?.low_uplift_wins ?? 0;
  const highU = wins?.high_uplift_wins ?? 0;
  if (lowU > 0) data.push({ from: won, to: "Low Uplift", size: lowU });
  if (highU > 0) data.push({ from: won, to: "High Uplift", size: highU });

  // Lost → Price/No Fit
  const priceTotal = priceDisagreement?.total ?? 0;
  const noFitTotal = noFit?.total ?? 0;
  if (priceTotal > 0) data.push({ from: lost, to: price, size: priceTotal });
  if (noFitTotal > 0) data.push({ from: lost, to: nofit, size: noFitTotal });

  // Price → Small/Medium/Large
  if (priceTotal > 0) {
    const small = priceDisagreement?.small_gap ?? 0;
    const medium = priceDisagreement?.medium_gap ?? 0;
    const large = priceDisagreement?.large_gap ?? 0;
    if (small > 0) data.push({ from: price, to: "Small Gap (≤5%)", size: small });
    if (medium > 0) data.push({ from: price, to: "Medium Gap (5-10%)", size: medium });
    if (large > 0) data.push({ from: price, to: "Large Gap (>10%)", size: large });
  }

  // No Fit → Few/Multiple/Many
  if (noFitTotal > 0) {
    const few = noFit?.few_loads ?? 0;
    const multiple = noFit?.multiple_loads ?? 0;
    const many = noFit?.many_loads ?? 0;
    if (few > 0) data.push({ from: nofit, to: "Few Loads (1-2)", size: few });
    if (multiple > 0) data.push({ from: nofit, to: "Multiple Loads (3-5)", size: multiple });
    if (many > 0) data.push({ from: nofit, to: "Many Loads (6+)", size: many });
  }

  if (!data.length) {
    return (
      <Card className="rounded-xl border border-gray-200 shadow-sm bg-white h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Call Outcomes</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 h-full">
          <div className="flex items-center justify-center h-full text-gray-500">
            No flows to display for the selected filters
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = {
    data,
    series: [
      {
        type: 'sankey',
        fromKey: 'from',
        toKey: 'to',
        sizeKey: 'size',
        sizeName: 'Calls',
        node: {
          alignment: 'justify',
          verticalAlignment: 'center',
          label: {
            placement: 'center',
            edgePlacement: 'outside',
          },
        },
        link: {
          fillOpacity: 0.5,
          strokeOpacity: 0.2,
          strokeWidth: 1,
        },
        tooltip: {
          enabled: true,
        },
        fills: [
          '#93c5fd', // Calls
          '#10b981', // Won
          '#ef4444', // Lost
          '#34d399', // Low Uplift
          '#059669', // High Uplift
          '#a78bfa', // Price Disagreement
          '#c4b5fd', // Small Gap
          '#a78bfa', // Medium Gap
          '#7c3aed', // Large Gap
          '#94a3b8', // No Fit
          '#60a5fa', // Few Loads
          '#f59e0b', // Multiple Loads
          '#ef4444', // Many Loads
        ],
        strokes: [
          '#93c5fd', '#10b981', '#ef4444', '#34d399', '#059669',
          '#a78bfa', '#c4b5fd', '#a78bfa', '#7c3aed', '#94a3b8',
          '#60a5fa', '#f59e0b', '#ef4444'
        ],
      },
    ],
    legend: { enabled: false },
    background: { visible: false },
  } as any;

  return (
    <Card className="rounded-xl border border-gray-200 shadow-sm bg-white flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Call Outcomes</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 h-full">
        <div className="h-full w-full">
          <AgCharts options={options} />
        </div>
      </CardContent>
    </Card>
  );
}


