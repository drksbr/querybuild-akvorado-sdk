import {
  QueryBuilder,
  FlowApiClient,
  Dimension,
  Units,
  LimitType,
  normalizeSankey,
  fmtBps,
  fmtPps,
  fmtBytes,
} from "../src";

// Demo configuration
const BASE_URL = process.env.FLOW_BASE_URL ?? "https://demo.akvorado.net/";
const AUTH_TOKEN = process.env.FLOW_AUTH_TOKEN;

async function main() {
  console.log("🌊 Flow SDK Comprehensive Demo");
  console.log("==============================\n");

  // Initialize client
  const client = new FlowApiClient({
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
    timeoutMs: 30000,
  });

  console.log("📊 1. Basic Time Series Analysis");
  console.log("-".repeat(40));

  const basicQuery = QueryBuilder.lastMinutes(30)
    .dimensions(Dimension.SrcAS, Dimension.DstAS)
    .filter("InIfBoundary = external")
    .units(Units.L3Bps)
    .points(60)
    .limit(5, LimitType.Avg)
    .build();

  try {
    const lineData = await client.graphLine(basicQuery);
    console.log(
      `✅ Found ${lineData.rows?.length || 0} flows with ${
        lineData.times?.length || 0
      } time points`
    );

    lineData.rows?.slice(0, 3).forEach((row, i) => {
      const label = row.join(" → ");
      const avg = lineData.average?.[i];
      console.log(`   ${label}: ${fmtBps(avg)}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n🎯 2. Top Talkers Analysis");
  console.log("-".repeat(40));

  const topTalkersQuery = QueryBuilder.lastHours(1)
    .dimensions(Dimension.SrcAddr)
    .filter("Proto = 6") // TCP
    .units(Units.L3Bps)
    .points(60)
    .limit(10, LimitType.Max)
    .truncate(24) // Group by /24 subnets
    .build();

  try {
    const topTalkers = await client.graphLine(topTalkersQuery);
    console.log(
      `✅ Top talkers analysis: ${topTalkers.rows?.length || 0} subnets`
    );

    topTalkers.rows?.slice(0, 3).forEach((row, i) => {
      const subnet = row[0];
      const peak = topTalkers.max?.[i];
      console.log(`   ${subnet}: Peak ${fmtBps(peak)}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n🌍 3. Geographic Analysis");
  console.log("-".repeat(40));

  const geoQuery = QueryBuilder.lastHours(6)
    .dimensions(Dimension.SrcCountry, Dimension.DstCountry)
    .filter("InIfBoundary = external")
    .units(Units.PPS)
    .points(60)
    .limit(8, LimitType.Sum)
    .bidirectional(true)
    .build();

  try {
    const geoData = await client.graphLine(geoQuery);
    console.log(
      `✅ Geographic flows: ${geoData.rows?.length || 0} country pairs`
    );

    geoData.rows?.slice(0, 3).forEach((row, i) => {
      const [src, dst] = row;
      const total = geoData.sum?.[i];
      console.log(`   ${src} → ${dst}: ${fmtPps(total)}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n🔄 4. Protocol Distribution");
  console.log("-".repeat(40));

  const protocolQuery = QueryBuilder.lastHours(2)
    .dimensions(Dimension.Proto)
    .units(Units.PPS)
    .points(60)
    .limit(10, LimitType.Avg)
    .build();

  try {
    const protocolData = await client.graphLine(protocolQuery);
    console.log(
      `✅ Protocol analysis: ${protocolData.rows?.length || 0} protocols`
    );

    protocolData.rows?.forEach((row, i) => {
      const protocol = row[0];
      const avg = protocolData.average?.[i];
      console.log(`   ${protocol}: ${fmtPps(avg)}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n🌊 5. Sankey Flow Visualization");
  console.log("-".repeat(40));

  const sankeyQuery = QueryBuilder.lastMinutes(60)
    .dimensions(Dimension.SrcAS, Dimension.DstAS)
    .filter("InIfBoundary = external")
    .units(Units.L3Bps)
    .limit(8, LimitType.Avg)
    .build();

  try {
    const sankeyRaw = await client.graphSankey(sankeyQuery);
    const sankeyData = normalizeSankey(sankeyRaw as any);

    console.log(
      `✅ Sankey diagram: ${sankeyData.nodes.length} nodes, ${sankeyData.links.length} links`
    );

    const topFlows = sankeyData.links
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    topFlows.forEach((link) => {
      const source = sankeyData.nodes[link.source];
      const target = sankeyData.nodes[link.target];
      console.log(`   ${source} → ${target}: ${fmtBps(link.value)}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error}`);
  }

  console.log("\n📈 6. Data Formatting Examples");
  console.log("-".repeat(40));

  console.log("Bandwidth formatting:");
  console.log(`   ${fmtBps(1500000)} (1.5M bps)`);
  console.log(`   ${fmtBps(2500000000)} (2.5G bps)`);

  console.log("Packet rate formatting:");
  console.log(`   ${fmtPps(50000)} (50K pps)`);
  console.log(`   ${fmtPps(1200000)} (1.2M pps)`);

  console.log("Byte formatting:");
  console.log(`   ${fmtBytes(1048576)} (1MB)`);
  console.log(`   ${fmtBytes(5368709120)} (5GB)`);

  console.log("\n⚙️ 7. Advanced Query Features");
  console.log("-".repeat(40));

  const advancedQuery = QueryBuilder.range(
    new Date(Date.now() - 3600000), // 1 hour ago
    new Date()
  )
    .dimensions(Dimension.ExporterName, Dimension.InIfName)
    .filter("InIfSpeed > 1000000000 AND Proto = 6") // TCP
    .units(Units.L3Bps)
    .limit(5, LimitType.P95) // 95th percentile
    .previousPeriod(true) // Compare with previous period
    .truncate(32, 128) // IP truncation
    .build();

  console.log("✅ Advanced query features demonstrated:");
  console.log("   - Custom time range");
  console.log("   - Complex filtering");
  console.log("   - 95th percentile ranking");
  console.log("   - Previous period comparison");
  console.log("   - IP address truncation");

  console.log("\n🎉 Demo Complete!");
  console.log("==================");
  console.log("\n💡 Tips:");
  console.log(
    "- Set FLOW_BASE_URL environment variable for your Akvorado instance"
  );
  console.log("- Set FLOW_AUTH_TOKEN if authentication is required");
  console.log("- Experiment with different dimensions and filters");
  console.log("- Check the examples/ directory for more detailed use cases");
}

if (require.main === module) {
  main().catch(console.error);
}
