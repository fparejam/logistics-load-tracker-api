# Quick Start Guide

## 📋 Prerequisites

Before starting, make sure you have:
- **Node.js 18+** (required for Convex CLI)
- **Bun** (latest version)

To check your Node version:
```bash
node --version
```

If you need to upgrade Node, you can use nvm:
```bash
nvm install 20
nvm use 20
```

## 🚀 Get Started in 3 Steps

### 1. Set Up Environment Variables

When you first run `bun run dev`, Convex will prompt you to login or run locally. Choose:
- **"Start without an account (run Convex locally)"** for local development

After Convex starts, it will display your `VITE_CONVEX_URL`. Copy it and create a `.env.local` file in the project root:

```bash
# Create .env.local file
cat > .env.local << 'EOF'
VITE_CONVEX_URL=<paste-the-url-from-convex-output>
API_KEY=demo-api-key-12345
EOF
```

**Required Environment Variables:**
- `VITE_CONVEX_URL` - Your Convex deployment URL (from `convex dev` output)
- `API_KEY` - Demo key for testing (use `demo-api-key-12345`)

### 2. Start the Development Server

After setting up your `.env.local` file, run:

```bash
bun run dev
```

The application will be available at `http://localhost:8080`

### 3. Access the Web Interface

Open your browser and navigate to:
- **API Documentation**: http://localhost:8080
- **API Tester**: http://localhost:8080/api-tester

### 4. Test the API

Use the demo API key to test the endpoints:

```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?limit=5"
```

## 📝 Demo API Key

```
demo-api-key-12345
```

**Important**: Change this key in production by updating the `API_KEY` environment variable in `.env.local`

## 🔧 Common Commands

### Seed the Database
```bash
bun x convex run loads:seedLoads
```

### Clear the Database
```bash
bun x convex run loads:clearLoads
```

### Type Check
```bash
bun run typecheck
```

### Lint Code
```bash
bun run lint
```

## 📚 Example API Requests

### Get All Loads
```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads"
```

### Filter by Origin
```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?origin=Chicago,%20IL"
```

### Filter by Equipment Type
```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?equipment_type=reefer"
```

### Sort by Rate (Descending)
```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?sort_by=loadboard_rate&sort_order=desc&limit=10"
```

### Filter by Rate Range
```bash
curl -H "X-API-Key: demo-api-key-12345" \
  "http://localhost:8080/loads?min_rate=1000&max_rate=2000"
```

## 🎯 Key Features

✅ Secure API key authentication  
✅ Filter by origin, destination, equipment type  
✅ Filter by date ranges and rate ranges  
✅ Pagination support (limit & offset)  
✅ Sort by pickup date or rate  
✅ Interactive API tester in the browser  
✅ Complete API documentation  
✅ 15 sample loads pre-loaded  

## 📖 Documentation

- **Full API Documentation**: See `API_DOCUMENTATION.md`
- **Project README**: See `README.md`
- **Web Interface**: Visit http://localhost:8080

## 🔐 Security Notes

1. The demo API key is for testing only
2. In production, use a strong, unique API key
3. Store API keys in environment variables
4. Always use HTTPS in production
5. Consider implementing rate limiting

## 🆘 Troubleshooting

### Database is Empty
Run the seed command:
```bash
bun x convex run loads:seedLoads
```

### API Returns 401 Unauthorized
Check that you're including the correct API key in the `X-API-Key` header

### Server Won't Start
Make sure all dependencies are installed:
```bash
bun install
```

## 📞 Need Help?

- Check the full documentation in `API_DOCUMENTATION.md`
- Review the code examples in `README.md`
- Use the interactive API tester at http://localhost:8080/api-tester
