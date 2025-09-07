// examples/sankey.ts
// Exemplo de consulta Sankey usando o mini-SDK + normalização.
// Rode com Bun:
//   FLOW_BASE_URL="https://flow.provedorveloz.com.br" \
//   FLOW_FILTER="InIfBoundary = external" \
//   FLOW_DIMS="SrcAS,ExporterAddress" \
//   FLOW_MINUTES=60 \
//   FLOW_LIMIT=12 \
//   FLOW_UNITS="l3bps" \
//   FLOW_TRUNC_V4=32 \
//   FLOW_TRUNC_V6=128 \
//   FLOW_TOP=20 \
//   # opcional: FLOW_DOT=1 para emitir Graphviz DOT
//   bun run examples/sankey.ts

import { FlowApiClient } from "../src/client";
import { QueryBuilder } from "../src/builder";
import { Dimension, Units, LimitType } from "../src/enums";
import { normalizeSankey, emitDotSankey } from "../src/sankey-normalize";

// ====== parâmetros via env ======
const BASE_URL =
  process.env.FLOW_BASE_URL ?? "https://flow.provedorveloz.com.br";
const FILTER = process.env.FLOW_FILTER ?? "InIfBoundary = external";
const DIMS_RAW = (process.env.FLOW_DIMS ?? "SrcAS,ExporterAddress")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MINUTES = Number(process.env.FLOW_MINUTES ?? 60);
const LIMIT = Number(process.env.FLOW_LIMIT ?? 12);
const UNITS = (process.env.FLOW_UNITS ?? "l3bps") as Units;
const TRUNC_V4 = process.env.FLOW_TRUNC_V4
  ? Number(process.env.FLOW_TRUNC_V4)
  : undefined;
const TRUNC_V6 = process.env.FLOW_TRUNC_V6
  ? Number(process.env.FLOW_TRUNC_V6)
  : undefined;
const TOP = Number(process.env.FLOW_TOP ?? 20);
const EMIT_DOT = process.env.FLOW_DOT === "1";

// (no topo do arquivo, junto dos outros envs)
const DOT_ONLY = process.env.FLOW_DOT_ONLY === "1";
const DOT_OUT = process.env.FLOW_DOT_OUT; // opcional: caminho para escrever o .dot

// ====== helpers ======
function toDimensions(names: string[]): Dimension[] {
  const out: Dimension[] = [];
  for (const n of names) {
    const d = (Dimension as any)[n];
    if (d) out.push(d);
    else console.warn(`[warn] dimensão desconhecida ignorada: ${n}`);
  }
  return out;
}

function fmtValue(units: Units, v: number) {
  if (v == null) return "-";
  switch (units) {
    case Units.L3Bps: {
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
    case Units.Bytes: {
      // Binário (1024) – bytes
      const u = ["B", "KB", "MB", "GB", "TB", "PB"];
      let i = 0;
      while (v >= 1024 && i < u.length - 1) {
        v /= 1024;
        i++;
      }
      return `${v.toFixed(i === 0 ? 0 : 2)} ${u[i]}`;
    }
    case Units.Packets: {
      const u = ["pkts", "Kpkts", "Mpkts", "Gpkts"];
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

// substitua sua função emitDot por esta versão "à prova de DOT"
function emitDot(
  nodes: string[],
  links: { source: number; target: number; value: number }[],
  units: Units
) {
  const esc = (s: string) => String(s).replace(/"/g, '\\"');

  // usa IDs simples e válidos: n0, n1, n2...
  const nid = (i: number) => `n${i}`;

  // formatador igual ao do exemplo anterior
  const fmtValue = (v?: number) => {
    if (v == null) return "-";
    const u = ["bps", "Kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
    let i = 0;
    while (v >= 1000 && i < u.length - 1) {
      v /= 1000;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${u[i]}`;
  };

  let dot = `digraph Sankey {\n  rankdir=LR;\n  node [shape=box, style="rounded,filled", fillcolor="#eef5ff", fontname="Inter,Arial"];\n`;

  // define nós
  for (let i = 0; i < nodes.length; i++) {
    dot += `  ${nid(i)} [label="${esc(nodes[i])}"];\n`;
  }

  // arestas usando os índices (n0 -> n1), sem dois-pontos nos IDs!
  for (const { source, target, value } of links) {
    const v = Number.isFinite(value) ? value : 0; // evita NaN
    const pen = Math.max(1, Math.log10(v + 1)); // espessura mínima 1
    dot += `  ${nid(source)} -> ${nid(target)} [label="${esc(
      fmtValue(v)
    )}", penwidth=${pen.toFixed(2)}];\n`;
  }

  dot += "}\n";
  console.log(dot);
}

function emitDotSafe(
  nodes: string[],
  links: { source: number; target: number; value: number }[],
  units: Units
): string {
  const esc = (s: string) => String(s).replace(/"/g, '\\"');

  const fmtBps = (val?: number) => {
    let v = Number.isFinite(val) ? (val as number) : 0;
    const u = ["bps", "Kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
    let i = 0;
    while (v >= 1000 && i < u.length - 1) {
      v /= 1000;
      i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${u[i]}`;
  };

  let dot = `digraph Sankey {\n  rankdir=LR;\n  node [shape=box, style="rounded,filled", fillcolor="#eef5ff", fontname="Inter,Arial"];\n`;
  for (let i = 0; i < nodes.length; i++)
    dot += `  n${i} [label="${esc(nodes[i])}"];\n`;

  for (const { source, target, value } of links) {
    const v = Number.isFinite(value) ? value : 0;
    const pen = Math.max(1, Math.log10(v + 1));
    dot += `  n${source} -> n${target} [label="${esc(
      fmtBps(v)
    )}", penwidth=${pen.toFixed(2)}];\n`;
  }
  dot += "}\n";
  return dot;
}

// ====== main ======
async function main() {
  const dims = toDimensions(DIMS_RAW);
  if (dims.length < 2) {
    console.error(
      "[erro] Sankey requer pelo menos 2 dimensões. Informe via FLOW_DIMS (ex.: SrcAS,ExporterAddress)."
    );
    process.exit(1);
  }

  const api = new FlowApiClient({ baseUrl: BASE_URL, timeoutMs: 30_000 });

  const q = QueryBuilder.lastMinutes(MINUTES)
    .dimensions(...dims)
    .filter(FILTER)
    .units(UNITS)
    .limit(LIMIT, LimitType.Avg)
    .truncate(TRUNC_V4, TRUNC_V6)
    .build();

  // Dica: graphSankey ignora points/previous-period; client já filtra.
  const raw = await api.graphSankey(q);
  const sankey = normalizeSankey(raw);

  // ordena links por valor desc para listar TOP
  const sorted = sankey.links.slice().sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, TOP);

  console.log(
    `Sankey (${dims.join(" → ")}) | nós=${sankey.nodes.length} | links=${
      sankey.links.length
    } | top=${TOP} | units=${UNITS}`
  );
  for (const l of top) {
    const src = sankey.nodes[l.source] ?? `#${l.source}`;
    const dst = sankey.nodes[l.target] ?? `#${l.target}`;
    console.log(`${src}  →  ${dst}  |  ${fmtValue(UNITS, l.value)}`);
  }

  if (EMIT_DOT) {
    const dot = emitDotSankey(sankey, {
      units: UNITS, // "l3bps" | "pps" | "bytes" | etc.
      levelOrder: DIMS_RAW, // ex.: ["SrcAS","ExporterAddress"]
      colorNodesByLevel: true,
      colorEdgesBySourceLevel: true,
      penwidthMin: 1,
      penwidthScale: 1.2,
    });

    if (DOT_ONLY) {
      if (DOT_OUT) await Bun.write(DOT_OUT, dot);
      else process.stdout.write(dot);
      process.exit(0);
    } else {
      console.error(
        `Sankey (${dims.join(" → ")}) | nós=${sankey.nodes.length} | links=${
          sankey.links.length
        } | units=${UNITS}`
      );
      process.stdout.write(dot);
    }
  }
}

main().catch(console.error);
