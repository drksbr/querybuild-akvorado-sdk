# Querybuild Akvorado SDK

A TypeScript SDK helper for querying the Akvorado flow analysis system API. Simplifies building complex queries, retrieving network flow data, and creating Sankey diagrams for traffic analysis.

## Features

🔄 **Akvorado API Helper** - Simplified interface for Akvorado API queries  
🏗️ **Query Builder** - Intuitive builder pattern for constructing complex flow queries  
📊 **Sankey Visualization** - Generate Sankey diagrams from flow query results  
🔍 **Flow Data Retrieval** - Easy-to-use methods for fetching network flow data  
⚡ **TypeScript Support** - Full type safety and IntelliSense support  
📈 **Data Formatting** - Automatic formatting and normalization of API responses

## Installation

```bash
npm install querybuild-akvorado-sdk
```

## Usage

### Basic Query Building

```typescript
import {
  QueryBuilder,
  FlowApiClient,
  Dimension,
  Units,
} from "querybuild-akvorado-sdk";

// Initialize the API client
const client = new FlowApiClient({
  baseUrl: "https://demo.akvorado.net/",
  authToken: "your-auth-token", // optional
  timeoutMs: 30000,
});

// Build a simple query for the last 30 minutes
const query = QueryBuilder.lastMinutes(30)
  .dimensions(Dimension.SrcAS, Dimension.DstAS)
  .filter("InIfBoundary = external")
  .units(Units.L3Bps)
  .points(120)
  .limit(10)
  .build();

// Execute line graph query
const results = await client.graphLine(query);
console.log("Flow data:", results);
```

### Advanced Time Range Queries

```typescript
import { QueryBuilder, LimitType } from "querybuild-akvorado-sdk";

// Query for the last 2 hours
const lastHoursQuery = QueryBuilder.lastHours(2)
  .dimensions(Dimension.SrcAddr, Dimension.DstAddr)
  .filter("Proto = 6 AND DstPort IN (80,443)") // TCP protocol
  .units(Units.PPS)
  .points(120)
  .limit(20, LimitType.Avg)
  .build();

// Query with custom date range
const customRangeQuery = QueryBuilder.range(
  "2024-01-01T00:00:00Z",
  "2024-01-01T23:59:59Z"
)
  .dimensions(Dimension.ExporterName, Dimension.InIfName)
  .filter("SrcAS = 64512")
  .units(Units.L2Bps)
  .points(288) // 5-minute intervals for 24 hours
  .build();

// Query for specific millisecond range
const preciseQuery = QueryBuilder.last(3600000) // Last hour in milliseconds
  .dimensions(Dimension.SrcCountry, Dimension.DstCountry)
  .units(Units.L3Bps)
  .previousPeriod(true) // Include comparison with previous period
  .build();
```

### Traffic Analysis Examples

```typescript
// Top Talkers Analysis - Find busiest source IPs
const topTalkersQuery = QueryBuilder.lastHours(1)
  .dimensions(Dimension.SrcAddr)
  .filter("InIfBoundary = external")
  .units(Units.L3Bps)
  .points(60)
  .limit(10, LimitType.Max) // Top 10 by peak traffic
  .truncate(24, 64) // Truncate IPv4 to /24, IPv6 to /64
  .build();

const topTalkers = await client.graphLine(topTalkersQuery);

// Protocol Distribution Analysis
const protocolQuery = QueryBuilder.lastMinutes(60)
  .dimensions(Dimension.Proto)
  .units(Units.PPS)
  .points(60)
  .limit(15, LimitType.Sum) // Top 15 protocols by total packets
  .build();

const protocolStats = await client.graphLine(protocolQuery);

// Port Analysis - Most active destination ports
const portQuery = QueryBuilder.lastHours(6)
  .dimensions(Dimension.DstPort)
  .filter("Proto = 6") // TCP protocol
  .units(Units.L3Bps)
  .points(72)
  .limit(25, LimitType.Avg)
  .build();

const portStats = await client.graphLine(portQuery);
```

### Geographic and AS Analysis

```typescript
// Country-to-Country Traffic Flow
const geoQuery = QueryBuilder.lastHours(24)
  .dimensions(Dimension.SrcCountry, Dimension.DstCountry)
  .filter("InIfBoundary = external")
  .units(Units.L3Bps)
  .points(144)
  .limit(50, LimitType.Sum)
  .bidirectional(true) // Combine bidirectional flows
  .build();

// AS Path Analysis
const asQuery = QueryBuilder.lastHours(12)
  .dimensions(Dimension.SrcAS, Dimension.DstAS)
  .filter("SrcAS != DstAS") // Exclude internal AS traffic
  .units(Units.L3Bps)
  .points(72)
  .limit(30, LimitType.Avg)
  .build();

// Network Boundary Analysis
const boundaryQuery = QueryBuilder.lastMinutes(120)
  .dimensions(Dimension.InIfBoundary, Dimension.OutIfBoundary)
  .units(Units.PPS)
  .points(120)
  .limit(10)
  .build();
```

### Sankey Diagram Generation

```typescript
import { normalizeSankey, emitDotSankey } from "querybuild-akvorado-sdk";

// Build query for Sankey visualization
const sankeyQuery = QueryBuilder.lastHours(1)
  .dimensions(Dimension.SrcAS, Dimension.ExporterAddress, Dimension.DstAS)
  .filter("InIfBoundary = external")
  .units(Units.L3Bps)
  .limit(15, LimitType.Avg)
  .truncate(32, 128)
  .build();

// Get Sankey data
const sankeyRaw = await client.graphSankey(sankeyQuery);

// Normalize the data
const sankeyData = normalizeSankey(sankeyRaw);

console.log(
  `Sankey diagram: ${sankeyData.nodes.length} nodes, ${sankeyData.links.length} links`
);

// Display top flows
const topFlows = sankeyData.links
  .sort((a, b) => b.value - a.value)
  .slice(0, 10);

topFlows.forEach((link) => {
  const source = sankeyData.nodes[link.source];
  const target = sankeyData.nodes[link.target];
  console.log(`${source} → ${target}: ${link.value.toFixed(2)} bps`);
});

// Generate DOT format for Graphviz
const dotOutput = emitDotSankey(sankeyData, {
  units: Units.L3Bps,
  levelOrder: ["SrcAS", "ExporterAddress", "DstAS"],
  colorNodesByLevel: true,
  colorEdgesBySourceLevel: true,
  penwidthMin: 1,
  penwidthScale: 1.2,
});

console.log(dotOutput); // Can be rendered with Graphviz tools
```

### Data Formatting and Display

```typescript
import { fmtBps, fmtPps, fmtBytes } from "querybuild-akvorado-sdk";

// Format bandwidth values
console.log(fmtBps(1500000)); // "1.50 Mbps"
console.log(fmtBps(2500000000)); // "2.50 Gbps"

// Format packet rates
console.log(fmtPps(50000)); // "50.00 Kpps"
console.log(fmtPps(1200000)); // "1.20 Mpps"

// Format byte values
console.log(fmtBytes(1048576)); // "1.00 MB"
console.log(fmtBytes(5368709120)); // "5.00 GB"

// Process and display line graph results
const query = QueryBuilder.lastMinutes(30)
  .dimensions(Dimension.SrcAS)
  .filter("InIfBoundary = external")
  .units(Units.L3Bps)
  .points(60)
  .limit(5)
  .build();

const results = await client.graphLine(query);

// Display formatted results
results.rows?.forEach((row: string[], index: number) => {
  const label = row.join(" · ");
  const avg = results.average?.[index];
  const max = results.max?.[index];
  const last = results.last?.[index];

  console.log(
    `${label.padEnd(20)} | avg: ${fmtBps(avg)} | max: ${fmtBps(
      max
    )} | last: ${fmtBps(last)}`
  );
});
```

### Complex Filtering Examples

```typescript
// DDoS Detection - High PPS to single destination
const ddosQuery = QueryBuilder.lastMinutes(15)
  .dimensions(Dimension.DstAddr, Dimension.SrcAS)
  .filter("DstPort = 80 OR DstPort = 443")
  .units(Units.PPS)
  .points(15)
  .limit(20, LimitType.Max)
  .truncate(32) // Group by /32 for precise targeting
  .build();

// Bandwidth Hogs - Large transfers
const bandwidthQuery = QueryBuilder.lastHours(1)
  .dimensions(Dimension.SrcAddr, Dimension.DstAddr)
  .filter("Proto = 6") // TCP protocol
  .units(Units.L3Bps)
  .points(60)
  .limit(15, LimitType.Sum)
  .truncate(24, 64) // Aggregate by subnet
  .build();

// Inter-AS Traffic Analysis
const interAsQuery = QueryBuilder.lastHours(6)
  .dimensions(Dimension.SrcAS, Dimension.DstAS)
  .filter("SrcAS != DstAS AND SrcAS != 0 AND DstAS != 0")
  .units(Units.L3Bps)
  .points(72)
  .limit(25, LimitType.Avg)
  .bidirectional(false) // Separate directions
  .build();

// Interface Utilization
const interfaceQuery = QueryBuilder.lastHours(2)
  .dimensions(Dimension.ExporterName, Dimension.InIfName)
  .filter("InIfSpeed > 1000000000") // Only gigabit+ interfaces
  .units(Units.L3Bps)
  .points(120)
  .limit(20, LimitType.P95) // 95th percentile utilization
  .build();
```

### Error Handling

```typescript
try {
  const query = QueryBuilder.lastMinutes(30)
    .dimensions(Dimension.SrcAS)
    .filter("InIfBoundary = external")
    .units(Units.L3Bps)
    .points(30)
    .build();

  const results = await client.graphLine(query);
  console.log("Query successful:", results);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("HTTP 4")) {
      console.error(
        "Client error (authentication, malformed query):",
        error.message
      );
    } else if (error.message.includes("HTTP 5")) {
      console.error("Server error:", error.message);
    } else {
      console.error("Network or timeout error:", error.message);
    }
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Authentication and Client Configuration

```typescript
// Basic client setup
const client = new FlowApiClient({
  baseUrl: "https://demo.akvorado.net/",
});

// Client with authentication
const authenticatedClient = new FlowApiClient({
  baseUrl: "https://demo.akvorado.net/",
  authToken: "your-jwt-token",
  timeoutMs: 45000,
  defaultHeaders: {
    "X-Custom-Header": "value",
  },
});

// Update auth token dynamically
authenticatedClient.setAuthToken("new-token");

// Using custom fetch implementation
const customClient = new FlowApiClient({
  baseUrl: "https://demo.akvorado.net/",
  fetchImpl: customFetch, // Your custom fetch function
  timeoutMs: 60000,
});
```

## Available Dimensions

The SDK supports all Akvorado dimensions through the `Dimension` enum:

**Network Elements:**

- `ExporterAddress`, `ExporterName`, `ExporterGroup`, `ExporterRole`
- `ExporterSite`, `ExporterRegion`, `ExporterTenant`

**Addresses and Networks:**

- `SrcAddr`, `DstAddr`, `SrcNetPrefix`, `DstNetPrefix`
- `SrcAS`, `DstAS`, `SrcNetName`, `DstNetName`
- `SrcNetRole`, `DstNetRole`, `SrcNetSite`, `DstNetSite`
- `SrcNetRegion`, `DstNetRegion`, `SrcNetTenant`, `DstNetTenant`

**Geographic:**

- `SrcCountry`, `DstCountry`, `SrcGeoCity`, `DstGeoCity`
- `SrcGeoState`, `DstGeoState`

**AS Path and BGP:**

- `DstASPath`, `Dst1stAS`, `Dst2ndAS`, `Dst3rdAS`, `DstCommunities`

**Interfaces:**

- `InIfName`, `OutIfName`, `InIfDescription`, `OutIfDescription`
- `InIfSpeed`, `OutIfSpeed`, `InIfConnectivity`, `OutIfConnectivity`
- `InIfProvider`, `OutIfProvider`, `InIfBoundary`, `OutIfBoundary`

**Protocol and Ports:**

- `EType`, `Proto`, `SrcPort`, `DstPort`
- `PacketSizeBucket`, `ForwardingStatus`, `TCPFlags`

## Available Units

- `Units.L2Bps` - Layer 2 bits per second
- `Units.L3Bps` - Layer 3 bits per second
- `Units.PPS` - Packets per second

## Available Limit Types

- `LimitType.Avg` - Average value
- `LimitType.Max` - Maximum value
- `LimitType.Sum` - Sum of values
- `LimitType.P95` - 95th percentile

## API Reference

### QueryBuilder

Static factory methods:

- `QueryBuilder.last(ms: number)` - Query for last N milliseconds
- `QueryBuilder.lastMinutes(n: number)` - Query for last N minutes
- `QueryBuilder.lastHours(n: number)` - Query for last N hours
- `QueryBuilder.range(start, end)` - Query for specific time range

Instance methods:

- `.dimensions(...dimensions)` - Set query dimensions
- `.filter(expression)` - Set filter expression
- `.units(unit)` - Set measurement units
- `.points(n)` - Set number of time points (line graphs)
- `.previousPeriod(flag)` - Include previous period comparison
- `.limit(n, type?)` - Limit results and specify ranking method
- `.truncate(v4?, v6?)` - Truncate IP addresses to subnet level
- `.bidirectional(flag)` - Combine bidirectional flows
- `.build()` - Build the final query object

### FlowApiClient

Constructor options:

- `baseUrl` - Akvorado server URL (required)
- `authToken` - Authentication token (optional)
- `defaultHeaders` - Default HTTP headers (optional)
- `timeoutMs` - Request timeout in milliseconds (optional)
- `fetchImpl` - Custom fetch implementation (optional)

Methods:

- `.graphLine(query)` - Execute line graph query
- `.graphSankey(query)` - Execute Sankey diagram query
- `.setAuthToken(token)` - Update authentication token

### Utility Functions

- `normalizeSankey(raw)` - Normalize Sankey data from API response
- `emitDotSankey(data, options)` - Generate Graphviz DOT format
- `fmtBps(value)` - Format bandwidth values
- `fmtPps(value)` - Format packet rate values
- `fmtBytes(value)` - Format byte values

## Examples

Complete examples are available in the `examples/` directory:

- `examples/line.ts` - Line graph queries and data formatting
- `examples/sankey.ts` - Sankey diagram generation and visualization

## License

MIT
