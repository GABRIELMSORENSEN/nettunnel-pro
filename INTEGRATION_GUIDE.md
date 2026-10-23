# NetTunnel Pro - Backend Integration Guide

## Overview

NetTunnel Pro now includes full backend integration with:
- **Database Layer**: MySQL/TiDB with Drizzle ORM
- **API Layer**: tRPC with type-safe procedures
- **Authentication**: Manus OAuth (pre-configured)
- **Data Persistence**: User configurations, test results, analytics

---

## Architecture

### Database Schema

```
users
├── id (PK)
├── openId (Manus OAuth)
├── name, email, role
└── timestamps

vpn_configurations
├── id (PK)
├── userId (FK)
├── carrier, server, sni, payloadMethod, protocol
├── isDefault
└── timestamps

connection_test_results
├── id (PK)
├── userId (FK)
├── carrier, server, sni, payloadMethod
├── status (success/failed/timeout)
├── latency, bandwidth, errorMessage
└── testDate

analytics_metrics
├── id (PK)
├── userId (FK)
├── carrier
├── totalTests, successCount, failureCount
├── averageLatency, averageBandwidth, successRate
├── bestSNI, bestPayloadMethod
└── lastUpdated

connection_history
├── id (PK)
├── userId (FK)
├── carrier, server, sni, payloadMethod
├── status (connected/disconnected/failed)
├── duration, ipAddress
└── connectionDate, disconnectionDate
```

---

## API Endpoints

All endpoints are under `/api/trpc/vpn.*` and require authentication.

### VPN Configurations

#### Save Configuration
```typescript
trpc.vpn.saveConfiguration.useMutation({
  name: "My Vivo Config",
  carrier: "vivo",
  server: "vivo-sp-01",
  sni: "portalrecarga.vivo.com.br",
  payloadMethod: "http",
  protocol: "vless",
  isDefault: true
})
```

#### Get All Configurations
```typescript
const { data: configs } = trpc.vpn.getConfigurations.useQuery()
```

#### Get Default Configuration
```typescript
const { data: defaultConfig } = trpc.vpn.getDefaultConfiguration.useQuery()
```

#### Delete Configuration
```typescript
trpc.vpn.deleteConfiguration.useMutation({
  configId: 123
})
```

---

### Test Results

#### Save Test Result
```typescript
trpc.vpn.saveTestResult.useMutation({
  carrier: "vivo",
  server: "vivo-sp-01",
  sni: "portalrecarga.vivo.com.br",
  payloadMethod: "http",
  status: "success",
  latency: 45,
  bandwidth: 85,
  duration: 3500
})
```

#### Get Test Results
```typescript
const { data: results } = trpc.vpn.getTestResults.useQuery({
  carrier: "vivo"
})
```

---

### Analytics

#### Get All Analytics
```typescript
const { data: allAnalytics } = trpc.vpn.getAnalytics.useQuery()
```

#### Get Carrier Analytics
```typescript
const { data: vivoAnalytics } = trpc.vpn.getCarrierAnalytics.useQuery({
  carrier: "vivo"
})
```

#### Update Analytics
```typescript
trpc.vpn.updateAnalytics.useMutation({
  carrier: "vivo",
  totalTests: 20,
  successCount: 18,
  failureCount: 2,
  averageLatency: 45,
  averageBandwidth: 85,
  bestSNI: "portalrecarga.vivo.com.br",
  bestPayloadMethod: "http"
})
```

---

### Connection History

#### Log Connection
```typescript
trpc.vpn.logConnection.useMutation({
  carrier: "vivo",
  server: "vivo-sp-01",
  sni: "portalrecarga.vivo.com.br",
  payloadMethod: "http",
  status: "connected",
  ipAddress: "203.0.113.42"
})
```

#### Get Connection History
```typescript
const { data: history } = trpc.vpn.getConnectionHistory.useQuery()
```

---

## Frontend Integration

### Using VPN API in Components

```typescript
import { trpc } from "@/lib/trpc";

export function VpnDashboard() {
  // Query saved configurations
  const { data: configs, isLoading } = trpc.vpn.getConfigurations.useQuery();
  
  // Mutation to save new configuration
  const saveConfig = trpc.vpn.saveConfiguration.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      trpc.useUtils().vpn.getConfigurations.invalidate();
    }
  });
  
  // Query analytics
  const { data: analytics } = trpc.vpn.getAnalytics.useQuery();
  
  return (
    <div>
      {isLoading ? <div>Loading...</div> : (
        <div>
          {configs?.map(config => (
            <div key={config.id}>{config.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Connecting TestRunner to Backend

### Current Implementation (Simulated)
The TestRunner currently simulates test results. To connect to real Xray servers:

```typescript
// server/vpn-router.ts - Add new procedure
testConfiguration: protectedProcedure
  .input(z.object({
    carrier: z.string(),
    server: z.string(),
    sni: z.string(),
    payloadMethod: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Call real Xray server
    const result = await testRealConnection({
      serverAddress: input.server,
      sni: input.sni,
      payloadMethod: input.payloadMethod,
    });
    
    // Save result to database
    await db.insert(connectionTestResults).values({
      userId: ctx.user.id,
      ...input,
      status: result.success ? 'success' : 'failed',
      latency: result.latency,
      bandwidth: result.bandwidth,
      duration: result.duration,
    });
    
    return result;
  })
```

---

## User Authentication

### Login Flow
1. User clicks "Login" → redirects to Manus OAuth portal
2. OAuth callback → `/api/oauth/callback` (handled automatically)
3. Session cookie set → User authenticated
4. All tRPC calls include session automatically

### Checking Auth Status
```typescript
import { useAuth } from "@/_core/hooks/useAuth";

export function App() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <LoginPage />;
  
  return <Dashboard />;
}
```

---

## Analytics Dashboard

### Key Metrics to Display

```typescript
export function AnalyticsDashboard() {
  const { data: analytics } = trpc.vpn.getAnalytics.useQuery();
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Overall Stats */}
      <Card>
        <h3>Total Tests</h3>
        <p>{analytics?.reduce((sum, a) => sum + a.totalTests, 0)}</p>
      </Card>
      
      {/* Per-Carrier Stats */}
      {analytics?.map(metric => (
        <Card key={metric.carrier}>
          <h3>{metric.carrier.toUpperCase()}</h3>
          <p>Success Rate: {metric.successRate}%</p>
          <p>Avg Latency: {metric.averageLatency}ms</p>
          <p>Best SNI: {metric.bestSNI}</p>
        </Card>
      ))}
    </div>
  );
}
```

---

## Saving User Configurations

### Save Default Configuration
```typescript
const saveDefault = trpc.vpn.saveConfiguration.useMutation();

async function setDefaultConfig(config) {
  // First, clear any existing default
  const currentDefault = await trpc.vpn.getDefaultConfiguration.useQuery();
  if (currentDefault.data) {
    await trpc.vpn.deleteConfiguration.mutate({
      configId: currentDefault.data.id
    });
  }
  
  // Save new default
  await saveDefault.mutateAsync({
    ...config,
    isDefault: true
  });
}
```

---

## Next Steps

### 1. Connect to Real Xray Servers
- Implement `testRealConnection()` function
- Add server endpoint for actual VPN testing
- Store real latency and bandwidth data

### 2. Implement Analytics Dashboard
- Create React component for metrics visualization
- Add charts (Recharts is pre-installed)
- Show per-carrier performance trends

### 3. Add User Profile Page
- Display saved configurations
- Show connection history
- Allow editing/deleting configurations

### 4. Implement Notifications
- Notify when test fails
- Alert on configuration changes
- Send analytics summaries

---

## Database Queries

### Get User's Best Configuration
```typescript
// In server/db.ts
export async function getUserBestConfiguration(userId: number) {
  const db = await getDb();
  
  const result = await db
    .select()
    .from(analyticsMetrics)
    .where(eq(analyticsMetrics.userId, userId))
    .orderBy((t) => desc(t.successRate))
    .limit(1);
  
  return result[0];
}
```

### Get Connection Statistics
```typescript
export async function getConnectionStats(userId: number) {
  const db = await getDb();
  
  const history = await db
    .select()
    .from(connectionHistory)
    .where(eq(connectionHistory.userId, userId));
  
  return {
    totalConnections: history.length,
    successfulConnections: history.filter(h => h.status === 'connected').length,
    averageDuration: history.reduce((sum, h) => sum + (h.duration || 0), 0) / history.length,
  };
}
```

---

## Environment Variables

All required environment variables are pre-configured:
- `DATABASE_URL` - MySQL/TiDB connection
- `JWT_SECRET` - Session signing
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth provider URL

No additional setup required!

---

## Testing the Integration

### Run Database Migrations
```bash
pnpm db:push
```

### Test tRPC Endpoints
```bash
# Start dev server
pnpm dev

# In browser console:
# await fetch('/api/trpc/vpn.getConfigurations').then(r => r.json())
```

### Check Database
```bash
# View database schema
pnpm db:studio  # Opens Drizzle Studio
```

---

## Troubleshooting

### "Database not available" Error
- Check `DATABASE_URL` environment variable
- Verify MySQL/TiDB connection
- Run `pnpm db:push` to create tables

### "User not authenticated" Error
- Ensure user is logged in via OAuth
- Check session cookie is set
- Verify `ctx.user` is available in procedure

### Type Errors in Frontend
- Run `pnpm check` to validate TypeScript
- Ensure tRPC client is properly initialized
- Check imports match procedure names

---

**Version:** 1.0.0  
**Last Updated:** 2026-05-05
