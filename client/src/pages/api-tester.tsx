import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export default function ApiTester() {
  const [apiKey, setApiKey] = useState("demo-api-key-12345");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [limit, setLimit] = useState("10");
  const [sortBy, setSortBy] = useState("pickup_datetime");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");

  const handleTest = async () => {
    setLoading(true);
    setResponse("");

    try {
      // Build query string
      const params = new URLSearchParams();
      if (origin) params.append("origin", origin);
      if (destination) params.append("destination", destination);
      if (equipmentType && equipmentType !== "none")
        params.append("equipment_type", equipmentType);
      if (minRate) params.append("min_rate", minRate);
      if (maxRate) params.append("max_rate", maxRate);
      if (limit) params.append("limit", limit);
      params.append("sort_by", sortBy);
      params.append("sort_order", sortOrder);

      const url = `/loads?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          "X-API-Key": apiKey,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Request failed");
        setResponse(JSON.stringify(data, null, 2));
      } else {
        toast.success(`Found ${data.total} loads`);
        setResponse(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      toast.error("Failed to fetch loads");
      setResponse(
        JSON.stringify(
          {
            error: "Request failed",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          null,
          2
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            API Tester
          </h1>
          <p className="text-muted-foreground">
            Test the Load Management API with different parameters
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Request Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                />
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g., Chicago, IL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentType">Equipment Type</Label>
                <Select value={equipmentType} onValueChange={setEquipmentType}>
                  <SelectTrigger id="equipmentType">
                    <SelectValue placeholder="Select equipment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All types</SelectItem>
                    <SelectItem value="dry_van">Dry Van</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="flatbed">Flatbed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minRate">Min Rate ($)</Label>
                  <Input
                    id="minRate"
                    type="number"
                    value={minRate}
                    onChange={(e) => setMinRate(e.target.value)}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRate">Max Rate ($)</Label>
                  <Input
                    id="maxRate"
                    type="number"
                    value={maxRate}
                    onChange={(e) => setMaxRate(e.target.value)}
                    placeholder="2000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sortBy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup_datetime">
                        Pickup Date
                      </SelectItem>
                      <SelectItem value="loadboard_rate">Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger id="sortOrder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleTest}
                disabled={loading || !apiKey}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-4" />
                    Test API
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              {response ? (
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                  {response}
                </pre>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Configure your request and click "Test API" to see the
                  response
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
