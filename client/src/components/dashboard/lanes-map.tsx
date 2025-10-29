import { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
} from "react-simple-maps";

interface LanesMapProps {
  calls: Array<Doc<"carrier_calls">>;
}

// US state coordinates (approximate centers)
const stateCoordinates: Record<string, [number, number]> = {
  AL: [-86.9023, 32.3182],
  AK: [-152.4044, 61.3707],
  AZ: [-111.4312, 33.7298],
  AR: [-92.3731, 34.9697],
  CA: [-119.4179, 36.7783],
  CO: [-105.7821, 39.5501],
  CT: [-72.7554, 41.5978],
  DE: [-75.5071, 39.3185],
  FL: [-81.5158, 27.6648],
  GA: [-83.5007, 32.1656],
  HI: [-157.4983, 21.0943],
  ID: [-114.7420, 44.0682],
  IL: [-89.3985, 40.6331],
  IN: [-86.1349, 40.2672],
  IA: [-93.0977, 41.8780],
  KS: [-98.4842, 39.0119],
  KY: [-84.2700, 37.8393],
  LA: [-91.9623, 30.9843],
  ME: [-69.4455, 45.2538],
  MD: [-76.6413, 39.0458],
  MA: [-71.3824, 42.4072],
  MI: [-85.6024, 44.3148],
  MN: [-94.6859, 46.7296],
  MS: [-89.3985, 32.3547],
  MO: [-92.6038, 37.9643],
  MT: [-110.3626, 46.8797],
  NE: [-99.9018, 41.4925],
  NV: [-116.4194, 38.8026],
  NH: [-71.5724, 43.1939],
  NJ: [-74.4057, 40.0583],
  NM: [-105.8701, 34.5199],
  NY: [-75.5268, 43.2994],
  NC: [-79.0193, 35.7596],
  ND: [-101.0020, 47.5515],
  OH: [-82.9071, 40.4173],
  OK: [-97.5164, 35.4676],
  OR: [-120.5542, 43.8041],
  PA: [-77.1945, 41.2033],
  RI: [-71.4774, 41.5801],
  SC: [-81.1637, 33.8361],
  SD: [-100.2263, 44.3683],
  TN: [-86.5804, 35.5175],
  TX: [-99.9018, 31.9686],
  UT: [-111.0937, 39.3210],
  VT: [-72.5778, 44.5588],
  VA: [-78.6569, 37.4316],
  WA: [-120.7401, 47.7511],
  WV: [-80.4549, 38.5976],
  WI: [-89.6165, 43.7844],
  WY: [-107.2903, 43.0760],
};

// City coordinates (major cities)
const cityCoordinates: Record<string, [number, number]> = {
  "Chicago": [-87.6298, 41.8781],
  "Los Angeles": [-118.2437, 34.0522],
  "Atlanta": [-84.3880, 33.7490],
  "New York": [-74.0060, 40.7128],
  "Seattle": [-122.3321, 47.6062],
  "Denver": [-104.9903, 39.7392],
  "Houston": [-95.3698, 29.7604],
  "Detroit": [-83.0458, 42.3314],
  "Dallas": [-96.7970, 32.7767],
  "Phoenix": [-112.0740, 33.4484],
  "Miami": [-80.1918, 25.7617],
  "Boston": [-71.0589, 42.3601],
  "Portland": [-122.6765, 45.5152],
  "Salt Lake City": [-111.8910, 40.7608],
  "New Orleans": [-90.0715, 29.9511],
  "Cleveland": [-81.6944, 41.4993],
};

export function LanesMap({ calls }: LanesMapProps) {
  const [topN, setTopN] = useState(20);

  // Group calls by lane
  const laneData = useMemo(() => {
    const lanes: Record<string, any> = {};

    calls.forEach((call) => {
      const laneKey = `${call.origin_city},${call.origin_state}-${call.destination_city},${call.destination_state}`;
      
      if (!lanes[laneKey]) {
        lanes[laneKey] = {
          origin: call.origin_city,
          originState: call.origin_state,
          destination: call.destination_city,
          destState: call.destination_state,
          calls: 0,
          won: 0,
          totalListed: 0,
          totalFinal: 0,
          totalSentiment: 0,
          noFit: 0,
        };
      }

      lanes[laneKey].calls += 1;
      if (call.outcome === "won_transferred") lanes[laneKey].won += 1;
      if (call.outcome === "no_fit_found") lanes[laneKey].noFit += 1;
      if (call.listed_rate) lanes[laneKey].totalListed += call.listed_rate;
      if (call.final_rate) lanes[laneKey].totalFinal += call.final_rate;
      lanes[laneKey].totalSentiment += call.sentiment_score;
    });

    // Calculate metrics and sort by calls
    return Object.values(lanes)
      .map((lane: any) => ({
        ...lane,
        winRate: lane.calls > 0 ? lane.won / lane.calls : 0,
        avgListed: lane.calls > 0 ? lane.totalListed / lane.calls : 0,
        avgFinal: lane.won > 0 ? lane.totalFinal / lane.won : 0,
        avgSentiment: lane.calls > 0 ? lane.totalSentiment / lane.calls : 0,
        pctNoFit: lane.calls > 0 ? (lane.noFit / lane.calls) * 100 : 0,
      }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, topN);
  }, [calls, topN]);

  // Get coordinates for a city
  const getCoordinates = (city: string, state: string): [number, number] | null => {
    // Try city first
    if (cityCoordinates[city]) {
      return cityCoordinates[city];
    }
    // Fall back to state
    if (stateCoordinates[state]) {
      return stateCoordinates[state];
    }
    return null;
  };

  // Get color based on win rate
  const getWinRateColor = (winRate: number) => {
    if (winRate >= 0.5) return "#16a34a"; // green
    if (winRate >= 0.35) return "#84cc16"; // lime
    if (winRate >= 0.25) return "#eab308"; // yellow
    if (winRate >= 0.15) return "#f59e0b"; // orange
    return "#dc2626"; // red
  };

  // Get stroke width based on calls
  const getStrokeWidth = (calls: number, maxCalls: number) => {
    const minWidth = 1;
    const maxWidth = 6;
    return minWidth + ((calls / maxCalls) * (maxWidth - minWidth));
  };

  const maxCalls = laneData.length > 0 ? Math.max(...laneData.map((l) => l.calls)) : 1;

  if (laneData.length === 0) {
    return (
      <Card className="border-stone-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Lanes by Win Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[520px] items-center justify-center text-sm text-stone-500">
            Not enough lane data to draw routes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-stone-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">
              Top Lanes by Win Rate
            </CardTitle>
            <p className="text-xs text-stone-600">
              Showing top {topN} lanes by call volume
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600">Top N:</span>
            <div className="w-32">
              <Slider
                value={[topN]}
                onValueChange={(value) => setTopN(value[0])}
                min={5}
                max={50}
                step={5}
                aria-label="Number of top lanes to display"
              />
            </div>
            <span className="text-xs font-medium text-stone-900">{topN}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{
              scale: 1000,
            }}
            width={800}
            height={500}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography="/us-states.json">
              {({ geographies }: any) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#f5f5f4"
                    stroke="#d6d3d1"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Geographies>

            {/* Draw lanes */}
            {laneData.map((lane, index) => {
              const originCoords = getCoordinates(lane.origin, lane.originState);
              const destCoords = getCoordinates(lane.destination, lane.destState);

              if (!originCoords || !destCoords) return null;

              const uplift =
                lane.avgListed > 0
                  ? ((lane.avgFinal - lane.avgListed) / lane.avgListed) * 100
                  : 0;

              return (
                <g key={index}>
                  <Line
                    from={originCoords}
                    to={destCoords}
                    stroke={getWinRateColor(lane.winRate)}
                    strokeWidth={getStrokeWidth(lane.calls, maxCalls)}
                    strokeLinecap="round"
                    opacity={0.7}
                  >
                    <title>
                      {`${lane.origin} → ${lane.destination}\nCalls: ${lane.calls} | Win: ${(lane.winRate * 100).toFixed(0)}%\nAvg Final: $${lane.avgFinal.toFixed(0)} | Uplift: ${uplift >= 0 ? "+" : ""}${uplift.toFixed(1)}%\nSentiment: ${lane.avgSentiment.toFixed(1)} | No-Fit: ${lane.pctNoFit.toFixed(0)}%`}
                    </title>
                  </Line>
                </g>
              );
            })}
          </ComposableMap>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-600">Win Rate:</span>
              <div className="flex items-center gap-1">
                <div className="size-3 rounded-full bg-red-600" />
                <span className="text-stone-600">{'<15%'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-3 rounded-full bg-orange-500" />
                <span className="text-stone-600">15-25%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-3 rounded-full bg-yellow-500" />
                <span className="text-stone-600">25-35%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-3 rounded-full bg-lime-500" />
                <span className="text-stone-600">35-50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-3 rounded-full bg-green-600" />
                <span className="text-stone-600">{'≥50%'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
