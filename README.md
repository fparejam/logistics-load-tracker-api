# Load Management Service

A secure REST API service for managing and tracking logistics shipments. Built with Express, Convex, and React.

## Features

- **Secure API Authentication**: API key-based authentication for all requests
- **Comprehensive Filtering**: Filter loads by origin, destination, equipment type, date ranges, and rate ranges
- **Pagination & Sorting**: Efficient data retrieval with customizable pagination and sorting
- **Real-time Data**: Powered by Convex for real-time database synchronization
- **Interactive API Tester**: Built-in web interface to test API endpoints
- **Complete Documentation**: Detailed API documentation with examples

## Tech Stack

- **Backend**: Express.js, Node.js
- **Database**: Convex (serverless database)
- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI

## Getting Started

### Prerequisites

- Bun (latest version)
- Node.js 18+ (for production deployment)

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
The `.env.local` file should contain:
```
CONVEX_DEPLOYMENT=<your-convex-deployment>
VITE_CONVEX_URL=<your-convex-url>
API_KEY=demo-api-key-12345
```

4. Seed the database:
```bash
bun x convex run loads:seedLoads
```

5. Start the development server:
```bash
bun run dev
```

The application will be available at `http://localhost:8080`

## API Usage

### Authentication

All API requests require an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: demo-api-key-12345" http://localhost:8080/loads
```

### Endpoints

#### GET /loads

Retrieve loads with optional filtering, pagination, and sorting.

**Query Parameters:**

| Parameter       | Type   | Description                          |
| --------------- | ------ | ------------------------------------ |
| origin          | string | Filter by origin city                |
| destination     | string | Filter by destination city           |
| equipment_type  | string | Filter by equipment type             |
| pickup_from     | string | Pickup date start (ISO 8601)         |
| pickup_to       | string | Pickup date end (ISO 8601)           |
| delivery_from   | string | Delivery date start (ISO 8601)       |
| delivery_to     | string | Delivery date end (ISO 8601)         |
| min_rate        | number | Minimum load rate                    |
| max_rate        | number | Maximum load rate                    |
| limit           | number | Number of results (default: 50, max: 100) |
| offset          | number | Skip N results (default: 0)          |
| sort_by         | string | Sort field (pickup_datetime or loadboard_rate) |
| sort_order      | string | Sort order (asc or desc)             |

**Example Requests:**

```bash
# Get all loads
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads"

# Filter by origin
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?origin=Chicago,%20IL"

# Filter by equipment type and sort by rate
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?equipment_type=reefer&sort_by=loadboard_rate&sort_order=desc"

# Filter by rate range with pagination
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?min_rate=1000&max_rate=2000&limit=10&offset=0"
```

**Response Format:**

```json
{
  "items": [
    {
      "_id": "...",
      "_creationTime": 1708012345678,
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
}
```

## Web Interface

The service includes a web interface with:

1. **API Documentation** (`/`) - Complete API reference with examples
2. **API Tester** (`/api-tester`) - Interactive tool to test API endpoints

Access the web interface by navigating to `http://localhost:8080` in your browser.

## Database Management

### Seeding Data

To populate the database with sample loads:

```bash
bun x convex run loads:seedLoads
```

### Clearing Data

To remove all loads from the database:

```bash
bun x convex run loads:clearLoads
```

## Project Structure

```
/workspace
├── client/                 # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable UI components
│       └── ...
├── convex/                # Convex backend
│   ├── schema.ts         # Database schema
│   ├── loads.ts          # Load queries and mutations
│   ├── router.ts         # HTTP routes (Convex)
│   └── ...
├── server/                # Express server
│   ├── index.ts          # Server entry point
│   └── routes.ts         # API routes
├── API_DOCUMENTATION.md  # Detailed API documentation
└── README.md            # This file
```

## Development

### Running Tests

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

## Security Considerations

1. **API Key Management**: 
   - Store API keys securely in environment variables
   - Never commit API keys to version control
   - Rotate keys regularly

2. **HTTPS**: 
   - Always use HTTPS in production
   - API keys are transmitted in headers and should be encrypted

3. **Rate Limiting**: 
   - Consider implementing rate limiting for production use
   - Monitor API usage for suspicious activity

4. **Input Validation**: 
   - All inputs are validated and sanitized
   - Date formats are validated before processing

## Equipment Types

The following equipment types are supported:

- `dry_van` - Standard enclosed trailer
- `reefer` - Refrigerated trailer
- `flatbed` - Open flatbed trailer

## Data Model

### Load Object

```typescript
{
  _id: string;                    // Auto-generated unique identifier
  _creationTime: number;          // Unix timestamp
  origin: string;                 // Origin city and state
  destination: string;            // Destination city and state
  pickup_datetime: number;        // UTC timestamp
  delivery_datetime: number;      // UTC timestamp
  equipment_type: string;         // Equipment type
  loadboard_rate: number;         // Rate in dollars
  weight: number;                 // Weight in pounds
  commodity_type: string;         // Type of commodity
  dimensions: string;             // Free-form dimensions text
}
```

## API Response Codes

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 401  | Unauthorized - Invalid API key       |
| 500  | Internal Server Error                |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Check the API documentation in `API_DOCUMENTATION.md`
- Review the code examples in this README
- Contact your system administrator

## Changelog

### Version 1.0.0 (Initial Release)

- Secure API key authentication
- Comprehensive load filtering
- Pagination and sorting support
- Interactive API tester
- Complete API documentation
- Sample data seeding
- Real-time database with Convex
