# Querybuild Akvorado SDK

A TypeScript SDK helper for querying the Akvorado flow analysis system API. Simplifies building complex queries, retrieving network flow data, and creating Sankey diagrams for traffic analysis.

## Features

� **Akvorado API Helper** - Simplified interface for Akvorado API queries  
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
import { FlowBuilder, SankeyClient } from "querybuild-akvorado-sdk";

// Build queries for Akvorado API
const builder = new FlowBuilder();
builder
  .setTimeRange('2024-01-01', '2024-01-02')
  .addFilter('srcAddr', '192.168.1.0/24')
  .addAggregation('dstAddr');

// Execute query and get results
const query = builder.build();
const results = await client.executeQuery(query);

// Generate Sankey diagram from results
const sankeyClient = new SankeyClient();
const diagram = sankeyClient.createSankey(results);
```

### Advanced Filtering

```typescript
import { FlowBuilder, FilterOperator } from "querybuild-akvorado-sdk";

const advancedBuilder = new FlowBuilder();

// Complex filtering with multiple conditions
advancedBuilder
  .setTimeRange('2024-01-01T00:00:00Z', '2024-01-01T23:59:59Z')
  .addFilter('srcAddr', '10.0.0.0/8', FilterOperator.IN)
  .addFilter('dstPort', [80, 443, 8080], FilterOperator.IN)
  .addFilter('protocol', 'TCP')
  .addFilter('bytes', 1000, FilterOperator.GREATER_THAN)
  .addAggregation(['srcAddr', 'dstAddr', 'dstPort'])
  .setLimit(1000);

const complexQuery = advancedBuilder.build();
```

### Top Talkers Analysis

```typescript
// Find top source IPs by bytes
const topTalkersBuilder = new FlowBuilder();
topTalkersBuilder
  .setTimeRange('2024-01-01', '2024-01-02')
  .addAggregation('srcAddr')
  .addMetric('bytes', 'sum')
  .addSort('bytes', 'desc')
  .setLimit(10);

const topTalkers = await client.executeQuery(topTalkersBuilder.build());
console.log('Top 10 source IPs by bytes:', topTalkers);
```

### Protocol Distribution

```typescript
// Analyze protocol distribution
const protocolBuilder = new FlowBuilder();
protocolBuilder
  .setTimeRange('2024-01-01', '2024-01-02')
  .addAggregation('protocol')
  .addMetric(['bytes', 'packets'], 'sum')
  .addSort('bytes', 'desc');

const protocolStats = await client.executeQuery(protocolBuilder.build());
```

### Custom Sankey Diagrams

```typescript
import { SankeyClient, SankeyOptions } from "querybuild-akvorado-sdk";

const sankeyClient = new SankeyClient();

// Customize Sankey diagram appearance
const options: SankeyOptions = {
  width: 800,
  height: 600,
  nodeWidth: 15,
  nodePadding: 10,
  format: 'svg',
  colorScheme: 'category20'
};

// Create Sankey from source -> destination flows
const sankeyData = sankeyClient
  .createSankey(flowData, options)
  .setSourceField('srcAddr')
  .setTargetField('dstAddr')
  .setValueField('bytes');

const diagram = sankeyData.render();
```

### Time Series Analysis

```typescript
// Analyze traffic patterns over time
const timeSeriesBuilder = new FlowBuilder();
timeSeriesBuilder
  .setTimeRange('2024-01-01', '2024-01-07')
  .addTimeGrouping('1h') // Group by hour
  .addAggregation(['time', 'protocol'])
  .addMetric('bytes', 'sum')
  .addSort('time', 'asc');

const timeSeries = await client.executeQuery(timeSeriesBuilder.build());

// Format for charting libraries
const chartData = client.formatForChart(timeSeries, 'time', 'bytes');
```

## Configuration

### Client Setup

```typescript
import { AkvoradoClient } from "querybuild-akvorado-sdk";

// Initialize client with Akvorado server configuration
const client = new AkvoradoClient({
  baseUrl: 'https://your-akvorado-instance.com',
  apiKey: 'your-api-key', // Optional, if authentication is required
  timeout: 30000, // Request timeout in milliseconds
  retries: 3 // Number of retry attempts for failed requests
});
```

### Query Validation

```typescript
// Validate query before execution
const builder = new FlowBuilder();
builder
  .setTimeRange('2024-01-01', '2024-01-02')
  .addFilter('srcAddr', '192.168.1.0/24');

// Check if query is valid
if (builder.isValid()) {
  const results = await client.executeQuery(builder.build());
} else {
  console.error('Invalid query:', builder.getValidationErrors());
}
```

### Batch Processing

```typescript
// Process multiple queries efficiently
const queries = [
  new FlowBuilder().setTimeRange('2024-01-01', '2024-01-02').addFilter('protocol', 'TCP'),
  new FlowBuilder().setTimeRange('2024-01-01', '2024-01-02').addFilter('protocol', 'UDP'),
  new FlowBuilder().setTimeRange('2024-01-01', '2024-01-02').addFilter('protocol', 'ICMP')
];

const results = await client.executeBatch(queries.map(q => q.build()));

// Process results
results.forEach((result, index) => {
  console.log(`Query ${index + 1} returned ${result.length} flows`);
});
```

### Error Handling

```typescript
import { AkvoradoError, QueryValidationError } from "querybuild-akvorado-sdk";

try {
  const results = await client.executeQuery(query);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Query validation failed:', error.message);
  } else if (error instanceof AkvoradoError) {
    console.error('Akvorado API error:', error.message, error.statusCode);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Capabilities

- ✅ Flow data construction
- ✅ Sankey diagram generation
- ✅ Data normalization
- ✅ Data formatting
- ✅ Complete TypeScript typing

## API

### FlowBuilder

Builder for constructing flow data queries.

### SankeyClient

Client for generating Sankey diagrams from flow data.

## Examples

See the `examples/` folder in the repository for complete usage examples.

## License

MIT
