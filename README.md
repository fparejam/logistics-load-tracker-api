# Logistics Load Tracker API

A production-ready REST API and web application for managing logistics shipments and tracking call metrics. Built with Express, Convex, and React.

## Features

- **Secure API** - API key authentication with comprehensive load filtering
- **Call Metrics Tracking** - Track performance metrics
- **Interactive Dashboard** - ACME performance reports and analytics
- **Real-time Database** - Powered by Convex for instant synchronization
- **Web Interface** - Interactive API tester and documentation

## Tech Stack

- **Backend**: Express.js, TypeScript, Bun
- **Database**: Convex (serverless, real-time)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Deployment**: Fly.io

## Quick Start

### Prerequisites

- **Bun** (latest) - [Install Bun](https://bun.sh)
- **Node.js 18+** (for Convex CLI)

### Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   
   Run `bun run dev` - Convex will prompt you to login or run locally. Choose "Start without an account" for local development.
   
   After Convex starts, copy the `VITE_CONVEX_URL` and create `.env.local`:
   ```bash
   VITE_CONVEX_URL=<your-convex-url>
   API_KEY=demo-api-key-12345
   ```

3. **Seed the database:**
   ```bash
   bun x convex run loads:seedLoads
   ```

4. **Start development server:**
   ```bash
   bun run dev
   ```

   Application available at `http://localhost:8080`

### Alternative: Run Servers Separately

```bash
# Terminal 1 - Convex
bun x convex dev

# Terminal 2 - Express Server
bun run dev:server
```

## API Endpoints

### GET /loads

Retrieve loads with filtering, pagination, and sorting.

**Headers:**
- `X-API-Key: <your-api-key>` (required)

**Query Parameters:**
- `load_id`, `origin`, `destination`, `equipment_type` - Filter by field
- `pickup_from`, `pickup_to`, `delivery_from`, `delivery_to` - Date range filters (ISO 8601)
- `min_rate`, `max_rate` - Rate range filters
- `limit` - Results per page (default: 5, max: 100)
- `offset` - Pagination offset
- `sort_by` - `pickup_datetime` or `loadboard_rate` (default: `pickup_datetime`)
- `sort_order` - `asc` or `desc` (default: `asc`)

**Example:**
```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?equipment_type=reefer&limit=10"
```

### POST /call-metrics

Create a new call metric record for HappyRobot AI agent performance tracking.

**Headers:**
- `X-API-Key: <your-api-key>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "agent_name": "Pablo",
  "equipment_type": "reefer",
  "outcome_tag": "won_transferred",
  "sentiment_tag": "very_positive",
  "negotiation_rounds": 2,
  "loadboard_rate": 1850,
  "final_rate": 2035,
  "related_load_id": "LOAD-002",
  "rejected_rate": null,
  "loads_offered": null
}
```

**Required Fields:**
- `agent_name` - Agent identifier (string)
- `equipment_type` - `"dry_van"`, `"reefer"`, or `"flatbed"` (string)
- `outcome_tag` - `"won_transferred"`, `"no_agreement_price"`, or `"no_fit_found"` (string)
- `sentiment_tag` - `"very_positive"`, `"positive"`, `"neutral"`, `"negative"`, or `"very_negative"` (string)
- `negotiation_rounds` - Number of rounds (non-negative integer)
- `loadboard_rate` - Listed rate in dollars (positive number)

**Conditional Fields:**
- `final_rate` - Required when `outcome_tag` is `"won_transferred"` (positive number), must be `null` otherwise
- `rejected_rate` - Optional, recommended when `outcome_tag` is `"no_agreement_price"` (positive number)
- `loads_offered` - Optional, recommended when `outcome_tag` is `"no_fit_found"` (non-negative integer)
- `related_load_id` - Optional, recommended for `"won_transferred"` outcomes (string)

**Note:** `timestamp_utc` is automatically generated - do not include it in the request.

**Example:**
```bash
curl -X POST \
  -H "X-API-Key: demo-api-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "Pablo",
    "equipment_type": "reefer",
    "outcome_tag": "won_transferred",
    "sentiment_tag": "very_positive",
    "negotiation_rounds": 2,
    "loadboard_rate": 1850,
    "final_rate": 2035
  }' \
  http://localhost:8080/call-metrics
```

## Web Interface

- **Dashboard** (`/acme-dashboard`) - ACME dashboard with KPIs
- **Map** (`/acme-map`) - Load visualization map
- **Report** (`/acme-report`) - Weekly performance report

## Development

### Commands

```bash
bun run dev          # Start all services
bun run dev:server   # Express server only
bun run dev:convex   # Convex only
bun run build        # Production build
bun run start        # Production server
bun run typecheck    # Type checking
bun run lint         # ESLint
```

### Database Management

```bash
# Seed loads
bun x convex run loads:seedLoads

# Clear loads
bun x convex run loads:clearLoads

# Seed call metrics
bun x convex run call_metrics:seedCallMetrics
```

## Deployment

Deployed to Fly.io with automatic deployment via GitHub Actions.

### Automatic Deployment

Deployment is automatic when code is merged to the `main` branch. The GitHub Actions workflow (`.github/workflows/deploy.yml`) handles:

1. **Convex Deployment** - Deploys backend functions to production
2. **Fly.io Deployment** - Builds and deploys the full application

**Production URL:** `https://anonymous-logistics-load-tracker-api.fly.dev`

**Custom Domain:** `https://happyrobot.fparejam.com`

### Manual Deployment

For manual deployments:

```bash
# Set all required secrets
fly secrets set VITE_CONVEX_URL=<your-convex-url>
fly secrets set VITE_MAPBOX_API_TOKEN=<your-mapbox-token>
fly secrets set VITE_AG_CHARTS_LICENSE=<your-ag-charts-license>
fly secrets set API_KEY=<your-production-api-key>

# Deploy
fly deploy
```

### Required GitHub Secrets

For automatic deployment via GitHub Actions, configure these secrets in your repository:

1. **CONVEX_DEPLOY_KEY** - Convex production deploy key
2. **FLY_API_TOKEN** - Fly.io API token for deployment
3. **VITE_CONVEX_URL** - Convex production URL
4. **VITE_MAPBOX_API_TOKEN** - Mapbox API token for map visualizations
5. **VITE_AG_CHARTS_LICENSE** - AG Charts license key

See `.github/workflows/README.md` for detailed setup instructions.

## Project Structure

```
├── client/              # React frontend
│   └── src/
│       ├── pages/       # Page components (dashboard, report, map)
│       ├── components/  # UI components
│       └── convex.ts    # Convex client
├── convex/              # Convex backend
│   ├── schema.ts        # Database schema
│   ├── loads.ts         # Load queries/mutations
│   ├── call_metrics.ts  # Call metrics queries/mutations
│   └── http.ts          # HTTP handler
├── server/              # Express server
│   ├── index.ts         # Server entry point
│   └── routes.ts        # API routes
└── fly.toml             # Fly.io configuration
```

## Troubleshooting

**API returns 401:**
- Verify `API_KEY` is set in `.env.local`
- Include `X-API-Key` header in requests
- Restart server after changing `.env.local`

**Empty database:**
```bash
bun x convex run loads:seedLoads
```

**Convex URL not set:**
1. Run `bun x convex dev` to get URL
2. Add to `.env.local`: `VITE_CONVEX_URL=<url>`
3. Restart server

## Security

- API key authentication required for all endpoints
- Environment variables for sensitive configuration
- Input validation and sanitization
- HTTPS in production (Fly.io automatic)
