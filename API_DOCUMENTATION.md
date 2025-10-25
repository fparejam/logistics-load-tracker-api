# Load Management Service API Documentation

## Overview

The Load Management Service is a secure REST API for managing and tracking logistics shipments. It provides endpoints for querying load information with comprehensive filtering, pagination, and sorting capabilities.

## Authentication

All API requests require authentication using an API key provided in the `X-API-Key` header.

### Demo API Key

For testing purposes, use the following API key:

```
demo-api-key-12345
```

**Note:** In production, this key should be kept secure and rotated regularly.

## Base URL

**Development:**
```
http://localhost:8080
```

**Production:**
Replace with your deployed application URL.

## Endpoints

### GET /loads

Retrieve a list of loads with optional filtering, pagination, and sorting.

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
| pickup_from     | string | Pickup date start (ISO 8601 format)            | `2024-02-15T00:00:00Z`     |
| pickup_to       | string | Pickup date end (ISO 8601 format)              | `2024-02-20T23:59:59Z`     |
| delivery_from   | string | Delivery date start (ISO 8601 format)          | `2024-02-16T00:00:00Z`     |
| delivery_to     | string | Delivery date end (ISO 8601 format)            | `2024-02-21T23:59:59Z`     |
| min_rate        | number | Minimum load rate (in dollars)                 | `500`                      |
| max_rate        | number | Maximum load rate (in dollars)                 | `2000`                     |

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
      "_id": "jd7x8y9z0a1b2c3d4e5f6g7h",
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

#### Response Fields

| Field             | Type   | Description                                    |
| ----------------- | ------ | ---------------------------------------------- |
| _id               | string | Unique identifier for the load                 |
| _creationTime     | number | Unix timestamp when the load was created       |
| origin            | string | Origin city and state                          |
| destination       | string | Destination city and state                     |
| pickup_datetime   | string | Pickup date and time (ISO 8601 format)         |
| delivery_datetime | string | Delivery date and time (ISO 8601 format)       |
| equipment_type    | string | Type of equipment required                     |
| loadboard_rate    | number | Rate for the load in dollars                   |
| weight            | number | Weight of the load in pounds                   |
| commodity_type    | string | Type of commodity being transported            |
| dimensions        | string | Dimensions of the load (free-form text)        |

#### Status Codes

| Code | Description                                      |
| ---- | ------------------------------------------------ |
| 200  | Success                                          |
| 401  | Unauthorized - Invalid or missing API key        |
| 500  | Internal Server Error                            |

## Example Requests

### Get all loads

```bash
curl -X GET "http://localhost:8080/loads" \
  -H "X-API-Key: demo-api-key-12345"
```

### Filter by origin

```bash
curl -X GET "http://localhost:8080/loads?origin=Chicago,%20IL" \
  -H "X-API-Key: demo-api-key-12345"
```

### Filter by equipment type

```bash
curl -X GET "http://localhost:8080/loads?equipment_type=reefer" \
  -H "X-API-Key: demo-api-key-12345"
```

### Filter by date range

```bash
curl -X GET "http://localhost:8080/loads?pickup_from=2024-02-15T00:00:00Z&pickup_to=2024-02-20T23:59:59Z" \
  -H "X-API-Key: demo-api-key-12345"
```

### Filter by rate range

```bash
curl -X GET "http://localhost:8080/loads?min_rate=1000&max_rate=2000" \
  -H "X-API-Key: demo-api-key-12345"
```

### Pagination

```bash
curl -X GET "http://localhost:8080/loads?limit=10&offset=0" \
  -H "X-API-Key: demo-api-key-12345"
```

### Sort by rate (descending)

```bash
curl -X GET "http://localhost:8080/loads?sort_by=loadboard_rate&sort_order=desc" \
  -H "X-API-Key: demo-api-key-12345"
```

### Combined filters

```bash
curl -X GET "http://localhost:8080/loads?origin=Chicago,%20IL&equipment_type=reefer&min_rate=1000&limit=5&sort_by=loadboard_rate&sort_order=desc" \
  -H "X-API-Key: demo-api-key-12345"
```

## Error Responses

### Invalid API Key

```json
{
  "error": "Unauthorized: Invalid or missing API key"
}
```

### Server Error

```json
{
  "error": "Internal server error",
  "message": "Error details here"
}
```

## Equipment Types

The following equipment types are available in the system:

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

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider implementing rate limiting to prevent abuse.

## Security Considerations

1. **API Key Storage**: Store the API key securely in environment variables
2. **HTTPS**: Always use HTTPS in production to encrypt API key transmission
3. **Key Rotation**: Regularly rotate API keys
4. **Access Logs**: Monitor API access logs for suspicious activity

## Development

### Seeding the Database

To populate the database with sample data:

```bash
bun x convex run loads:seedLoads
```

### Clearing the Database

To clear all loads from the database:

```bash
bun x convex run loads:clearLoads
```

## Support

For issues or questions, please contact your system administrator.
