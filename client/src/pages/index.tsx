import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Database, Key, Filter, ArrowUpDown, TestTube, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const apiUrl = window.location.origin + "/loads";
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-3">
                Load Management Service
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground">
                Secure API for managing and tracking logistics shipments
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button onClick={() => navigate("/acme-dashboard")} size="lg" className="w-full sm:w-auto">
                <BarChart3 className="mr-2 size-4" />
                ACME Dashboard
              </Button>
              <Button onClick={() => navigate("/api-tester")} size="lg" variant="outline" className="w-full sm:w-auto">
                <TestTube className="mr-2 size-4" />
                API Tester
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="size-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All API requests require a valid API key in the{" "}
              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                X-API-Key
              </code>{" "}
              header.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">
                Demo API Key (for testing):
              </p>
              <code className="text-sm font-mono">demo-api-key-12345</code>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoint */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="size-5" />
              API Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">
                GET
              </Badge>
              <code className="text-sm">{apiUrl}</code>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground mb-3">
                Example Request:
              </p>
              <pre className="text-xs font-mono overflow-x-auto">
                {`curl -X GET "${apiUrl}?origin=Chicago,%20IL&limit=10" \\
  -H "X-API-Key: demo-api-key-12345"`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Query Parameters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="size-5" />
              Query Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Filtering</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      origin
                    </code>
                    <span className="text-muted-foreground">
                      Filter by origin city
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      destination
                    </code>
                    <span className="text-muted-foreground">
                      Filter by destination city
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      equipment_type
                    </code>
                    <span className="text-muted-foreground">
                      Filter by equipment type
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      pickup_from
                    </code>
                    <span className="text-muted-foreground">
                      Pickup date start (ISO 8601)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      pickup_to
                    </code>
                    <span className="text-muted-foreground">
                      Pickup date end (ISO 8601)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      delivery_from
                    </code>
                    <span className="text-muted-foreground">
                      Delivery date start (ISO 8601)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      delivery_to
                    </code>
                    <span className="text-muted-foreground">
                      Delivery date end (ISO 8601)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      min_rate
                    </code>
                    <span className="text-muted-foreground">
                      Minimum load rate
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      max_rate
                    </code>
                    <span className="text-muted-foreground">
                      Maximum load rate
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ArrowUpDown className="size-4" />
                  Pagination & Sorting
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      limit
                    </code>
                    <span className="text-muted-foreground">
                      Number of results (max 100)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      offset
                    </code>
                    <span className="text-muted-foreground">
                      Skip N results
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      sort_by
                    </code>
                    <span className="text-muted-foreground">
                      pickup_datetime or loadboard_rate
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      sort_order
                    </code>
                    <span className="text-muted-foreground">asc or desc</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-5" />
              Response Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto">
                {`{
  "items": [
    {
      "_id": "...",
      "_creationTime": 1234567890,
      "origin": "Chicago, IL",
      "destination": "New York, NY",
      "pickup_datetime": "2024-02-16T06:00:00.000Z",
      "delivery_datetime": "2024-02-17T14:00:00.000Z",
      "equipment_type": "reefer",
      "loadboard_rate": 1850.0,
      "weight": 38000,
      "commodity_type": "Frozen Foods",
      "dimensions": "53x102"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
