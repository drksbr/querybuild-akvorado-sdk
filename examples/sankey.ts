import { FlowApiClient } from "../src/client";
import { QueryBuilder } from "../src/builder";
import { Dimension, Units, LimitType } from "../src/enums";
import { normalizeSankey, emitDotSankey } from "../src/sankey-normalize";

// ====== Configuration from environment variables ======
const BASE_URL = process.env.FLOW_BASE_URL ?? "https://demo.akvorado.net/";
const AUTH_TOKEN = process.env.FLOW_AUTH_TOKEN;
const FILTER = process.env.FLOW_FILTER ?? "InIfBoundary = external";
const DIMS_RAW = (process.env.FLOW_DIMS ?? "SrcAS,ExporterAddress,DstAS")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MINUTES = Number(process.env.FLOW_MINUTES ?? 60);
const LIMIT = Number(process.env.FLOW_LIMIT ?? 15);
const UNITS = (process.env.FLOW_UNITS ?? "l3bps") as Units;
const TRUNC_V4 = process.env.FLOW_TRUNC_V4
  ? Number(process.env.FLOW_TRUNC_V4)
  : 32;
const TRUNC_V6 = process.env.FLOW_TRUNC_V6
  ? Number(process.env.FLOW_TRUNC_V6)
  : 128;
const TOP = Number(process.env.FLOW_TOP ?? 20);
const EMIT_DOT = process.env.FLOW_DOT === "1";
const DOT_ONLY = process.env.FLOW_DOT_ONLY === "1";
const DOT_OUT = process.env.FLOW_DOT_OUT; // Optional: path to write .dot file

// ====== Helper functions ======
function toDimensions(names: string[]): Dimension[] {
  const out: Dimension[] = [];
  for (const n of names) {
    const d = (Dimension as any)[n];
    if (d) out.push(d);
    else console.warn(`[warn] Unknown dimension ignored: ${n}`);
  }
  return out;
}

function formatValue(units: Units, v: number): string {
  if (v == null || !Number.isFinite(v)) return "-";

  switch (units) {
    case Units.L3Bps:
    case Units.L2Bps: {
      // SI (1000) – bps
      const u = ["bps", "Kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
      let i = 0;
      while (v >= 1000 && i < u.length - 1) {
        v /= 1000;
        i++;
      }
      return `${v.toFixed(i === 0 ? 0 : 2)} ${u[i]}`;
    }
    case Units.PPS: {
      const u = ["pps", "Kpps", "Mpps", "Gpps"];
      let i = 0;
      while (v >= 1000 && i < u.length - 1) {
        v /= 1000;
        i++;
      }
      return `${v.toFixed(i === 0 ? 0 : 2)} ${u[i]}`;
    }
    default:
      return String(v);
  }
}

async function basicSankeyExample() {
  console.log("=== Basic Sankey Diagram Example ===\n");

  const dims = toDimensions(DIMS_RAW);
  if (dims.length < 2) {
    console.error(
      "[error] Sankey requires at least 2 dimensions. Set FLOW_DIMS (e.g., 'SrcAS,DstAS')."
    );
    process.exit(1);
  }

  const api = new FlowApiClient({
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
    timeoutMs: 30_000,
  });

  const query = QueryBuilder.lastMinutes(MINUTES)
    .dimensions(...dims)
    .filter(FILTER)
    .units(UNITS)
    .limit(LIMIT, LimitType.Avg)
    .truncate(TRUNC_V4, TRUNC_V6)
    .build();

  console.log("Sankey query configuration:");
  console.log(`- Time range: Last ${MINUTES} minutes`);
  console.log(`- Flow path: ${DIMS_RAW.join(" → ")}`);
  console.log(`- Filter: ${FILTER}`);
  console.log(`- Units: ${UNITS}`);
  console.log(`- Limit: Top ${LIMIT} by average`);
  console.log(`- Truncation: IPv4/${TRUNC_V4}, IPv6/${TRUNC_V6}\n`);

  try {
    // Note: graphSankey automatically ignores points/previous-period
    const raw = await api.graphSankey(query);
    const sankey = normalizeSankey(raw as any);

    console.log("Sankey diagram generated:");
    console.log(`- Nodes: ${sankey.nodes.length}`);
    console.log(`- Links: ${sankey.links.length}`);
    console.log(`- Flow path: ${DIMS_RAW.join(" → ")}\n`);

    // Sort links by value descending to show top flows
    const sorted = sankey.links.slice().sort((a, b) => b.value - a.value);
    const topFlows = sorted.slice(0, TOP);

    console.log(`Top ${TOP} flows:`);
    console.log(
      "Source".padEnd(25) + " → " + "Target".padEnd(25) + " | " + "Value"
    );
    console.log("─".repeat(70));

    topFlows.forEach((link) => {
      const source = sankey.nodes[link.source] ?? `#${link.source}`;
      const target = sankey.nodes[link.target] ?? `#${link.target}`;
      const value = formatValue(UNITS, link.value);

      console.log(`${source.padEnd(25)} → ${target.padEnd(25)} | ${value}`);
    });

    return sankey;
  } catch (error) {
    console.error("Error generating Sankey diagram:", error);
    throw error;
  }
}

async function multiLevelSankeyExample() {
  console.log("\n=== Multi-Level Sankey Example (Country → AS → Port) ===\n");

  const api = new FlowApiClient({
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
    timeoutMs: 30_000,
  });

  const query = QueryBuilder.lastHours(2)
    .dimensions(Dimension.SrcCountry, Dimension.SrcAS, Dimension.DstPort)
    .filter("InIfBoundary = external AND Proto = 6")
    .units(Units.L3Bps)
    .limit(12, LimitType.Sum)
    .build();

  try {
    const raw = await api.graphSankey(query);
    const sankey = normalizeSankey(raw as any);

    console.log(
      `Multi-level flow analysis (${sankey.nodes.length} nodes, ${sankey.links.length} links):`
    );

    // Group flows by level
    const flowsByLevel = new Map<string, number>();
    sankey.links.forEach((link) => {
      const source = sankey.nodes[link.source];
      const target = sankey.nodes[link.target];

      // Determine flow type based on node patterns
      let flowType = "Other";
      if (source.match(/^[A-Z]{2}$/) && target.match(/^\d+$/)) {
        flowType = "Country → AS";
      } else if (source.match(/^\d+$/) && target.match(/^\d+$/)) {
        flowType = "AS → Port";
      }

      flowsByLevel.set(
        flowType,
        (flowsByLevel.get(flowType) || 0) + link.value
      );
    });

    console.log("\nFlow aggregation by level:");
    flowsByLevel.forEach((value, level) => {
      console.log(`${level}: ${formatValue(Units.L3Bps, value)}`);
    });
  } catch (error) {
    console.error("Error in multi-level Sankey:", error);
  }
}

async function generateDotVisualization(sankey: any) {
  if (!EMIT_DOT) return;

  console.log("\n=== Generating DOT Visualization ===\n");

  try {
    const dot = emitDotSankey(sankey, {
      units: UNITS,
      levelOrder: DIMS_RAW,
      colorNodesByLevel: true,
      colorEdgesBySourceLevel: true,
      penwidthMin: 1,
      penwidthScale: 1.2,
    });

    if (DOT_ONLY) {
      // Output only DOT format
      if (DOT_OUT) {
        const fs = await import("fs");
        fs.writeFileSync(DOT_OUT, dot);
        console.log(`DOT file written to: ${DOT_OUT}`);
      } else {
        process.stdout.write(dot);
      }
    } else {
      console.log("DOT format generated (use with Graphviz):");
      console.log("─".repeat(50));
      console.log(dot);
      console.log("─".repeat(50));
      console.log("\nTo render with Graphviz:");
      console.log("  dot -Tsvg sankey.dot -o sankey.svg");
      console.log("  dot -Tpng sankey.dot -o sankey.png");
    }
  } catch (error) {
    console.error("Error generating DOT visualization:", error);
  }
}

async function comparativeAnalysisExample() {
  console.log("\n=== Comparative Analysis Example ===\n");

  const api = new FlowApiClient({
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
    timeoutMs: 30_000,
  });

  // Compare TCP vs UDP traffic patterns using protocol numbers
  const protocolNumbers = [6, 17]; // TCP=6, UDP=17
  const protocolNames = ["TCP", "UDP"];
  const results = new Map();

  for (let i = 0; i < protocolNumbers.length; i++) {
    const protoNum = protocolNumbers[i];
    const protoName = protocolNames[i];

    const query = QueryBuilder.lastHours(1)
      .dimensions(Dimension.SrcAS, Dimension.DstAS)
      .filter(`InIfBoundary = external AND Proto = ${protoNum}`)
      .units(Units.PPS)
      .limit(10, LimitType.Avg)
      .build();

    try {
      const raw = await api.graphSankey(query);
      const sankey = normalizeSankey(raw as any);
      results.set(protoName, sankey);

      const totalFlow = sankey.links.reduce((sum, link) => sum + link.value, 0);
      console.log(
        `${protoName} traffic: ${sankey.nodes.length} nodes, ${
          sankey.links.length
        } links, total: ${formatValue(Units.PPS, totalFlow)}`
      );
    } catch (error) {
      console.error(`Error analyzing ${protoName} traffic:`, error);
    }
  }

  // Compare top flows
  console.log("\nTop AS-to-AS flows comparison:");
  protocolNames.forEach((protoName) => {
    const sankey = results.get(protoName);
    if (sankey) {
      const topFlow = sankey.links.sort((a, b) => b.value - a.value)[0];
      if (topFlow) {
        const source = sankey.nodes[topFlow.source];
        const target = sankey.nodes[topFlow.target];
        console.log(
          `${protoName}: ${source} → ${target} (${formatValue(
            Units.PPS,
            topFlow.value
          )})`
        );
      }
    }
  });
}

async function main() {
  console.log("Flow SDK Sankey Diagram Examples");
  console.log("=================================\n");

  try {
    const sankey = await basicSankeyExample();
    await multiLevelSankeyExample();
    await comparativeAnalysisExample();
    await generateDotVisualization(sankey);

    console.log("\n=== Examples Complete ===");
    console.log("\nCustomization options (environment variables):");
    console.log("- FLOW_BASE_URL: Akvorado server URL");
    console.log("- FLOW_AUTH_TOKEN: Authentication token (if required)");
    console.log("- FLOW_FILTER: Query filter expression");
    console.log("- FLOW_DIMS: Comma-separated dimensions for flow path");
    console.log("- FLOW_MINUTES: Time range in minutes");
    console.log("- FLOW_LIMIT: Number of top results");
    console.log("- FLOW_UNITS: Units (l3bps, l2bps, pps)");
    console.log("- FLOW_TOP: Number of top flows to display");
    console.log("- FLOW_DOT: Set to '1' to generate Graphviz DOT output");
    console.log("- FLOW_DOT_ONLY: Set to '1' to output only DOT format");
    console.log("- FLOW_DOT_OUT: File path to save DOT output");
  } catch (error) {
    console.error("Example execution failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
