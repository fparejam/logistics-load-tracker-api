# ACME Dashboard - Quick Start

## 🚀 Access the Dashboard

1. **Start the application** (if not already running):
   ```bash
   bun run dev
   ```

2. **Seed the database** (first time only):
   ```bash
   npx convex run seed:default
   ```

3. **Open in browser**:
   - Go to the home page
   - Click the "ACME Dashboard" button
   - Or navigate directly to: `http://localhost:8080/acme-dashboard`

## 📊 What You'll See

### Top Bar (Filters)
- **Date Range**: Today, Last 7 Days, This Week, Last 30 Days
- **Equipment**: All, Dry Van, Reefer, Flatbed
- **Agent**: All, Pablo, Katya
- **Outcome**: All, Won, Lost (Price), No Fit
- **Granularity**: Daily, Weekly
- **Share Button**: Copy shareable link with current filters

### Row 1 - KPIs (6 Cards)
1. **Total Calls** - Total number of calls
2. **Win Rate** - Percentage with color badge (green/amber/red)
3. **Avg Rounds** - Average negotiation rounds
4. **% Price Disagreements** - Percentage of price-related losses
5. **% No Fit** - Percentage of no-fit outcomes
6. **Sentiment** - Score from -1 to +1 with emoji

### Row 2 - Financial (3 Cards)
1. **Avg Listed** - Average loadboard rate
2. **Avg Final** - Average final negotiated rate
3. **Avg Uplift %** - Percentage difference (color-coded)

## 🎯 Key Features

✅ **Responsive**: Works on mobile, tablet, and desktop
✅ **Accessible**: WCAG AA compliant with keyboard navigation
✅ **Shareable**: URL updates with filters for easy sharing
✅ **Real-time**: Data updates automatically when filters change
✅ **Loading States**: Skeleton loaders while fetching data

## 📁 Main Component

The main export is:
```tsx
import { DashboardTop } from "@/components/dashboard/dashboard-top";
```

Use it in any page:
```tsx
<DashboardTop />
```

## 🔧 Customization

### Change Default Filters
Edit `client/src/components/dashboard/dashboard-top.tsx`:
```tsx
const [filters, setFilters] = useState<TopFiltersState>(() => {
  return {
    dateRange: "last7",  // Change this
    equipment: "all",    // Change this
    agent: "all",        // Change this
    outcome: "all",      // Change this
    granularity: "daily" // Change this
  };
});
```

### Add More Agents
Agents are automatically pulled from the database. Just add calls with new agent names.

### Modify Colors
Colors are defined in the component files using Tailwind classes:
- Green: `text-green-600`
- Amber: `text-amber-600`
- Red: `text-red-600`
- Blue: `text-blue-600`

## 📊 Sample Data

The seed script creates:
- 60 days of historical data
- 5-12 calls per day
- 2 agents: Pablo and Katya
- 3 equipment types: dry_van, reefer, flatbed
- Realistic outcomes and sentiment scores

## 🐛 Troubleshooting

**No data showing?**
- Run the seed script: `npx convex run seed:default`
- Check the browser console for errors
- Verify Convex is running

**Filters not working?**
- Check browser console for errors
- Verify the query is being called
- Check network tab for API calls

**Styling looks wrong?**
- Clear browser cache
- Verify Tailwind is compiling
- Check for CSS conflicts

## 📝 Notes

- All percentages are stored as decimals (0-1) in the database
- Currency values are integers (USD)
- Sentiment is converted from 5-level tags to numeric scores
- Filters persist in URL for shareable links
- Mobile layout: 2 KPIs per row, filters stack
- Desktop layout: 6 KPIs across, filters in one row

## 🎉 That's It!

The ACME Dashboard is ready to use. Enjoy exploring your call metrics!
