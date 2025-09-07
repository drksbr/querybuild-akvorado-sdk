// examples/line.ts
// Example of line graph queries using the Flow SDK
// This demonstrates time-series analysis of network traffic data

import { FlowApiClient } from "../src/client";
import { QueryBuilder } from "../src/builder";
import { Dimension, Units, LimitType } from "../src/enums";
import { fmtBps, fmtPps } from "../src/format";

// Configuration from environment variables
const BASE_URL = process.env.FLOW_BASE_URL ?? "https://demo.akvorado.net/";
const AUTH_TOKEN = process.env.FLOW_AUTH_TOKEN; // Optional authentication
const FILTER = process.env.FLOW_FILTER ?? "InIfBoundary = external";
const DIMS = (process.env.FLOW_DIMS ?? "SrcAS,DstAS").split(
  ","
) as (keyof typeof Dimension)[];
const MINUTES = Number(process.env.FLOW_MINUTES ?? 30);
const LIMIT = Number(process.env.FLOW_LIMIT ?? 10);
const UNITS = (process.env.FLOW_UNITS ?? "l3bps") as Units;

// Initialize API client
const api = new FlowApiClient({
  baseUrl: BASE_URL,
  authToken: AUTH_TOKEN,
  timeoutMs: 30_000,
});

async function basicLineExample() {
  console.log("=== Basic Line Graph Example ===\n");

  // Build query for the last 30 minutes
  const query = QueryBuilder.lastMinutes(MINUTES)
    .dimensions(...DIMS.map((d) => Dimension[d]))
    .filter(FILTER)
    .units(UNITS)
    .points(120) // 120 time points over 30 minutes = 15-second intervals
    .limit(LIMIT, LimitType.Avg)
    .truncate(32, 128) // Truncate IPv4 to /32, IPv6 to /128
    .previousPeriod(true) // Include comparison with previous period
    .build();

  console.log("Query configuration:");
  console.log(`- Time range: Last ${MINUTES} minutes`);
  console.log(`- Dimensions: ${DIMS.join(" → ")}`);
  console.log(`- Filter: ${FILTER}`);
  console.log(`- Units: ${UNITS}`);
  console.log(`- Limit: Top ${LIMIT} by average`);
  console.log(
    `- Points: ${query.points} (${Math.round(
      (MINUTES * 60) / 120
    )}-second intervals)\n`
  );

  try {
    const resp = await api.graphLine(query);

    console.log("Results:");
    console.log(`- Found ${resp.rows?.length || 0} flows`);
    console.log(`- Time series data: ${resp.times?.length || 0} data points\n`);

    // Display top flows with formatted values
    resp.rows?.forEach((row: string[], i: number) => {
      const label = row.join(" · ");
      const avg = resp.average?.[i];
      const max = resp.max?.[i];
      const last = resp.last?.[i];
      const prev = resp.prevAverage?.[i]; // Previous period comparison

      const formatValue = UNITS === Units.PPS ? fmtPps : fmtBps;

      console.log(
        `${label.padEnd(30)} | avg: ${formatValue(avg).padStart(
          12
        )} | max: ${formatValue(max).padStart(12)} | last: ${formatValue(
          last
        ).padStart(12)} ${
          prev ? `| prev: ${formatValue(prev).padStart(12)}` : ""
        }`
      );
    });
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

async function protocolAnalysisExample() {
  console.log("\n=== Protocol Analysis Example ===\n");

  const protocolQuery = QueryBuilder.lastHours(1)
    .dimensions(Dimension.Proto)
    .filter("InIfBoundary = external")
    .units(Units.PPS)
    .limit(15, LimitType.Sum)
    .points(60) // 1-minute intervals
    .build();

  try {
    const resp = await api.graphLine(protocolQuery);

    console.log("Protocol distribution (last hour):");
    resp.rows?.forEach((row: string[], i: number) => {
      const protocol = row[0];
      const totalPps = resp.sum?.[i] || 0;
      const avgPps = resp.average?.[i] || 0;
      const maxPps = resp.max?.[i] || 0;

      console.log(
        `${protocol.padEnd(10)} | total: ${fmtPps(totalPps).padStart(
          12
        )} | avg: ${fmtPps(avgPps).padStart(12)} | peak: ${fmtPps(
          maxPps
        ).padStart(12)}`
      );
    });
  } catch (error) {
    console.error("Error in protocol analysis:", error);
  }
}

async function topTalkersExample() {
  console.log("\n=== Top Talkers Analysis Example ===\n");

  const topTalkersQuery = QueryBuilder.lastMinutes(60)
    .dimensions(Dimension.SrcAddr)
    .filter("InIfBoundary = external AND Proto = 6") // TCP
    .units(Units.L3Bps)
    .limit(20, LimitType.Max) // Top 20 by peak bandwidth
    .truncate(24) // Group by /24 subnets
    .points(60)
    .build();

  try {
    const resp = await api.graphLine(topTalkersQuery);

    console.log("Top source networks (last hour, by peak bandwidth):");
    resp.rows?.forEach((row: string[], i: number) => {
      const srcNet = row[0];
      const peakBps = resp.max?.[i] || 0;
      const avgBps = resp.average?.[i] || 0;
      const currentBps = resp.last?.[i] || 0;

      console.log(
        `${srcNet.padEnd(18)} | peak: ${fmtBps(peakBps).padStart(
          12
        )} | avg: ${fmtBps(avgBps).padStart(12)} | current: ${fmtBps(
          currentBps
        ).padStart(12)}`
      );
    });
  } catch (error) {
    console.error("Error in top talkers analysis:", error);
  }
}

async function interfaceUtilizationExample() {
  console.log("\n=== Interface Utilization Example ===\n");

  const interfaceQuery = QueryBuilder.lastHours(2)
    .dimensions(Dimension.ExporterName, Dimension.InIfName)
    .filter("InIfSpeed > 1000000000") // Only interfaces >= 1 Gbps
    .units(Units.L3Bps)
    .limit(15, LimitType.P95) // Top 15 by 95th percentile
    .points(120) // 1-minute intervals
    .build();

  try {
    const resp = await api.graphLine(interfaceQuery);

    console.log("Interface utilization (last 2 hours, 95th percentile):");
    resp.rows?.forEach((row: string[], i: number) => {
      const [exporter, ifName] = row;
      const p95Bps = resp.p95?.[i] || 0;
      const avgBps = resp.average?.[i] || 0;
      const maxBps = resp.max?.[i] || 0;

      console.log(
        `${exporter}/${ifName} | p95: ${fmtBps(p95Bps).padStart(
          12
        )} | avg: ${fmtBps(avgBps).padStart(12)} | max: ${fmtBps(
          maxBps
        ).padStart(12)}`
      );
    });
  } catch (error) {
    console.error("Error in interface utilization analysis:", error);
  }
}

async function main() {
  console.log("Flow SDK Line Graph Examples");
  console.log("============================\n");

  await basicLineExample();
  await protocolAnalysisExample();
  await topTalkersExample();
  await interfaceUtilizationExample();

  console.log("\n=== Example Complete ===");
  console.log("\nTo customize this example, set environment variables:");
  console.log("- FLOW_BASE_URL: Akvorado server URL");
  console.log("- FLOW_AUTH_TOKEN: Authentication token (if required)");
  console.log("- FLOW_FILTER: Query filter expression");
  console.log("- FLOW_DIMS: Comma-separated dimensions (e.g., 'SrcAS,DstAS')");
  console.log("- FLOW_MINUTES: Time range in minutes");
  console.log("- FLOW_LIMIT: Number of top results to show");
  console.log("- FLOW_UNITS: Units (l3bps, l2bps, pps)");
}

main().catch(console.error);
