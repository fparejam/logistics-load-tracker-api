# Load Management Service

A secure REST API service for managing and tracking logistics shipments. Built with Express, Convex, and React.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Security](#security)

## Features

- **Secure API Authentication**: API key-based authentication for all requests
- **Comprehensive Filtering**: Filter loads by origin, destination, equipment type, ISO 8601 date ranges, and rate ranges
- **Pagination & Sorting**: Efficient data retrieval with customizable pagination and sorting
- **Real-time Data**: Powered by Convex for real-time database synchronization
- **Interactive API Tester**: Built-in web interface to test API endpoints
- **ISO 8601 Date Format**: Human-readable dates for better LLM and human comprehension

## Tech Stack

- **Backend**: Express.js, Node.js
- **Database**: Convex (serverless database)
- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI

## Getting Started

### Prerequisites

- Bun (latest version)
- Node.js 18+ (for Convex CLI commands)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd load-management-service
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
   - First, run `bun run dev` to start Convex
   - When prompted, choose "Start without an account (run Convex locally)"
   - Convex will display your `VITE_CONVEX_URL` - copy it
   - Create a `.env.local` file in the project root:
   
   ```bash
   cat > .env.local << 'EOF'
   VITE_CONVEX_URL=<paste-the-url-from-convex-output>
   API_KEY=demo-api-key-12345
   EOF
   ```
   
   **Required Environment Variables:**
   - `VITE_CONVEX_URL` - Your Convex deployment URL (from `convex dev` output)
   - `API_KEY` - Demo key for testing (use `demo-api-key-12345`)

4. Seed the database (in a new terminal with Node 20):
```bash
nvm use 20  # If you have nvm
npx convex run loads:seedLoads
```

5. Start the development server:
```bash
bun run dev
```

The application will be available at `http://localhost:8080`

## API Documentation

### Authentication

All API requests require an API key in the `X-API-Key` header.

**Demo API Key:** `demo-api-key-12345`

### Base URL

**Development:** `http://localhost:8080`  
**Production:** Replace with your deployed URL

### GET /loads

Retrieve loads with optional filtering, pagination, and sorting.

#### Headers

| Header      | Required | Description                    |
| ----------- | -------- | ------------------------------ |
| X-API-Key   | Yes      | Your API key for authentication |

#### Query Parameters

##### Filtering

| Parameter       | Type   | Description                                    | Example                    |
| --------------- | ------ | ---------------------------------------------- | -------------------------- |
| origin          | string | Filter by origin city                          | `Chicago, IL`              |
| destination     | string | Filter by destination city                     | `New York, NY`             |
| equipment_type  | string | Filter by equipment type                       | `dry_van`, `reefer`, `flatbed` |
| pickup_from     | string | Pickup date start (ISO 8601)                   | `2024-02-15T00:00:00Z`     |
| pickup_to       | string | Pickup date end (ISO 8601)                     | `2024-02-20T23:59:59Z`     |
| delivery_from   | string | Delivery date start (ISO 8601)                 | `2024-02-16T00:00:00Z`     |
| delivery_to     | string | Delivery date end (ISO 8601)                   | `2024-02-21T23:59:59Z`     |
| min_rate        | number | Minimum load rate (dollars)                    | `500`                      |
| max_rate        | number | Maximum load rate (dollars)                    | `2000`                     |

##### Pagination

| Parameter | Type   | Description                      | Default | Max |
| --------- | ------ | -------------------------------- | ------- | --- |
| limit     | number | Number of results to return      | 50      | 100 |
| offset    | number | Number of results to skip        | 0       | -   |

##### Sorting

| Parameter  | Type   | Description                                  | Options                              | Default           |
| ---------- | ------ | -------------------------------------------- | ------------------------------------ | ----------------- |
| sort_by    | string | Field to sort by                             | `pickup_datetime`, `loadboard_rate`  | `pickup_datetime` |
| sort_order | string | Sort order                                   | `asc`, `desc`                        | `asc`             |

#### Response Format

```json
{
  "items": [
    {
      "_id": "jx78ekwakqtfjk18gr0ghbp5cn7t56sn",
      "_creationTime": 1761385704914.265,
      "origin": "Los Angeles, CA",
      "destination": "Phoenix, AZ",
      "pickup_datetime": "2024-02-15T08:00:00.000Z",
      "delivery_datetime": "2024-02-15T18:00:00.000Z",
      "equipment_type": "dry_van",
      "loadboard_rate": 850.0,
      "weight": 42000,
      "commodity_type": "Electronics",
      "dimensions": "48x102"
    }
  ],
  "total": 15,
  "limit": 50,
  "offset": 0
}
```

#### Response Fields

| Field             | Type   | Description                                    |
| ----------------- | ------ | ---------------------------------------------- |
| _id               | string | Unique identifier                              |
| _creationTime     | number | Unix timestamp when created                    |
| origin            | string | Origin city and state                          |
| destination       | string | Destination city and state                     |
| pickup_datetime   | string | Pickup date/time (ISO 8601)                    |
| delivery_datetime | string | Delivery date/time (ISO 8601)                  |
| equipment_type    | string | Type of equipment (dry_van, reefer or flatbed) |
| loadboard_rate    | number | Rate in dollars                                |
| weight            | number | Weight in pounds                               |
| commodity_type    | string | Type of commodity                              |
| dimensions        | string | Dimensions (free-form text)                    |

#### Status Codes

| Code | Description                                      |
| ---- | ------------------------------------------------ |
| 200  | Success                                          |
| 401  | Unauthorized - Invalid or missing API key        |
| 500  | Internal Server Error                            |

### Example Requests

```bash
# Get all loads
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads"

# Filter by origin
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?origin=Chicago,%20IL"

# Filter by equipment type
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?equipment_type=reefer"

# Filter by date range
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?pickup_from=2024-02-15T00:00:00Z&pickup_to=2024-02-20T23:59:59Z"

# Filter by rate range
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?min_rate=1000&max_rate=2000"

# Pagination
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?limit=10&offset=0"

# Sort by rate (descending)
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?sort_by=loadboard_rate&sort_order=desc"

# Combined filters
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?origin=Chicago,%20IL&equipment_type=reefer&min_rate=1000&limit=5&sort_by=loadboard_rate&sort_order=desc"
```

### Error Responses

**Invalid API Key:**
```json
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

**Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Error details here"
}
```

## Web Interface

Access the web interface at `http://localhost:8080`:

- **API Documentation** (`/`) - Complete API reference with examples
- **API Tester** (`/api-tester`) - Interactive tool to test API endpoints

## Database Management

### Seeding Data

```bash
npx convex run loads:seedLoads
```

### Clearing Data

```bash
npx convex run loads:clearLoads
```

## Project Structure

```
/workspace
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   └── ...
│   └── index.html
├── convex/                # Convex backend
│   ├── schema.ts         # Database schema
│   ├── loads.ts          # Load queries and mutations
│   ├── router.ts         # HTTP routes
│   └── ...
├── server/                # Express server
│   ├── index.ts          # Server entry point
│   └── routes.ts         # API routes
└── README.md
```

## Development

### Type Checking
```bash
bun run typecheck
```

### Linting
```bash
bun run lint
```

### Building for Production
```bash
bun run build
```

### Starting Production Server
```bash
bun run start
```

### Note on Convex CLI Commands

Some Convex CLI commands require Node.js 18+. Use nvm to switch to Node 20:

```bash
nvm use 20
npx convex run loads:seedLoads  # Example command
```

## Security

1. **API Key Management**: Store keys in environment variables, never commit to version control
2. **HTTPS**: Always use HTTPS in production
3. **Key Rotation**: Regularly rotate API keys
4. **Input Validation**: All inputs are validated and sanitized
