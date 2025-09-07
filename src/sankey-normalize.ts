export type SankeyRaw =
  | {
      // formato 1: node-link
      nodes: string[];
      links: Array<{
        source: number;
        target: number;
        // o valor pode vir em qualquer uma destas chaves:
        value?: number;
        weight?: number;
        bytes?: number;
        count?: number;
        v?: number;
      }>;
      meta?: Record<string, unknown>;
    }
  | {
      // formato 2: rows + values (cada row é um caminho pelas dimensões)
      rows: string[][];
      // o valor pode vir com estes nomes também:
      values?: number[];
      weights?: number[];
      v?: number[];
      meta?: Record<string, unknown>;
    };

export interface SankeyNormalized {
  nodes: string[]; // rótulos únicos
  links: { source: number; target: number; value: number }[]; // edges agregadas
}

/** Converte qualquer valor numérico possível para number seguro (>=0). */
function toNumber(x: unknown, def = 0): number {
  const n = Number(x);
  if (!Number.isFinite(n) || Number.isNaN(n)) return def;
  return n;
}

/** Normaliza: aceita "nodes+links" OU "rows+values", agrega arestas e valida índices. */
export function normalizeSankey(raw: SankeyRaw): SankeyNormalized {
  // --- Formato 1: nodes + links ---
  if ("nodes" in raw && "links" in raw) {
    const nodes = raw.nodes.slice();
    const linksAgg = new Map<string, number>(); // "s->t" => value

    for (const l of raw.links) {
      // fallback de campos para o valor
      const val =
        l.value ??
        (l as any).weight ??
        (l as any).bytes ??
        (l as any).count ??
        (l as any).v ??
        (l as any).xps ??
        0;

      const source = (l as any).source;
      const target = (l as any).target;

      // Se source e target são strings, preciso encontrar/criar índices
      let sourceIdx: number;
      let targetIdx: number;

      if (typeof source === "string" && typeof target === "string") {
        // Encontrar/criar índices para os nós
        sourceIdx = nodes.findIndex((n) => n === source);
        if (sourceIdx === -1) {
          sourceIdx = nodes.length;
          nodes.push(source);
        }

        targetIdx = nodes.findIndex((n) => n === target);
        if (targetIdx === -1) {
          targetIdx = nodes.length;
          nodes.push(target);
        }
      } else {
        // Assume que são índices numéricos
        sourceIdx = toNumber(source, -1);
        targetIdx = toNumber(target, -1);
        if (!Number.isInteger(sourceIdx) || !Number.isInteger(targetIdx))
          continue;
        if (
          sourceIdx < 0 ||
          targetIdx < 0 ||
          sourceIdx >= nodes.length ||
          targetIdx >= nodes.length
        )
          continue;
      }

      const key = `${sourceIdx}->${targetIdx}`;
      linksAgg.set(key, (linksAgg.get(key) ?? 0) + toNumber(val, 0));
    }

    const links = Array.from(linksAgg.entries()).map(([k, v]) => {
      const [s, t] = k.split("->").map((x) => Number(x));
      return { source: s, target: t, value: v };
    });

    return { nodes, links };
  }

  // --- Formato 2: rows + values ---
  if ("rows" in raw) {
    const rows = raw.rows || [];
    // aceita 'values' | 'weights' | 'v' | 'xps'
    const vals =
      (raw as any).values ??
      (raw as any).weights ??
      (raw as any).v ??
      (raw as any).xps ??
      new Array(rows.length).fill(0);

    const labelToIndex = new Map<string, number>();
    const nodes: string[] = [];
    const linksAgg = new Map<string, number>();

    const idx = (label: string) => {
      let i = labelToIndex.get(label);
      if (i == null) {
        i = nodes.length;
        nodes.push(label);
        labelToIndex.set(label, i);
      }
      return i;
    };

    rows.forEach((path, i) => {
      const value = toNumber(vals[i], 0);
      if (!Array.isArray(path) || path.length < 2) return;
      for (let k = 0; k < path.length - 1; k++) {
        const a = idx(String(path[k]));
        const b = idx(String(path[k + 1]));
        const key = `${a}->${b}`;
        linksAgg.set(key, (linksAgg.get(key) ?? 0) + value);
      }
    });

    const links = Array.from(linksAgg.entries()).map(([k, v]) => {
      const [a, b] = k.split("->").map(Number);
      return { source: a, target: b, value: v };
    });

    return { nodes, links };
  }

  throw new Error("Formato de Sankey inesperado.");
}

/* ------------------------------------------------------------------------------------ */
/*                       Inferência de níveis (dimensões) por rótulo                    */
/* ------------------------------------------------------------------------------------ */

/**
 * Extrai o "prefixo" (antes do primeiro ':') do rótulo de um nó.
 * Ex.: "SrcAS: 15169: Google" -> "SrcAS"
 */
export function labelPrefix(label: string): string {
  const m = String(label).match(/^\s*([^:]+)\s*:/);
  return m ? m[1].trim() : "";
}

/**
 * Mapeia cada nó a um índice de nível (0,1,2,...) com base na ordem de `levelOrder`.
 * Se `levelOrder` não for passado, usa a ordem em que novos prefixos aparecem nos rótulos.
 */
export function inferLevelIndex(
  nodes: string[],
  levelOrder?: string[]
): number[] {
  const order: string[] = [];
  const prefixToLevel = new Map<string, number>();

  const ensureLevel = (p: string) => {
    if (!p) return -1;
    let i = prefixToLevel.get(p);
    if (i == null) {
      i = levelOrder ? levelOrder.indexOf(p) : order.push(p) - 1;
      if (i < 0 && levelOrder) {
        // prefixo não está em levelOrder → empilha no final
        i =
          levelOrder.length +
          Array.from(prefixToLevel.values()).filter(
            (x) => x >= levelOrder.length
          ).length;
      }
      prefixToLevel.set(p, i);
    }
    return i;
  };

  return nodes.map((label) => ensureLevel(labelPrefix(label)));
}

/* ------------------------------------------------------------------------------------ */
/*                               Emissor Graphviz DOT                                   */
/* ------------------------------------------------------------------------------------ */

export interface DotThemeOptions {
  /** Unidade semântica para o label (ex.: 'l3bps'|'pps'|'bytes'|...). Só afeta o texto do label. */
  units?: string;
  /** Largura mínima do traço. */
  penwidthMin?: number; // default: 1
  /** Fator de escala da largura do traço: penwidth = max(min, log10(value+1) * scale). */
  penwidthScale?: number; // default: 1
  /** Ordem dos níveis (dimensões) para pintar cores por nível. Ex.: ['SrcAS','ExporterAddress'] */
  levelOrder?: string[];
  /** Paleta de cores por nível (hex). Será ciclada se faltar cor. */
  levelColors?: string[];
  /** Cor padrão do nó quando não há nível (ou não quis pintar). */
  nodeFillDefault?: string; // default: #eef5ff
  /** Direção do fluxo no DOT. */
  rankdir?: "LR" | "RL" | "TB" | "BT";
  /** Nome da fonte dos nós. */
  fontname?: string;
  /** Pintar nós por nível? */
  colorNodesByLevel?: boolean; // default: true
  /** Pintar arestas com cor do nível de origem? */
  colorEdgesBySourceLevel?: boolean; // default: false
  /** Formatação custom do label de valor (sobrescreve units). */
  formatValueLabel?: (value: number, units?: string) => string;
}

/** Formata valores conforme unidade "comum". */
function defaultFormatValue(value: number, units?: string): string {
  if (!Number.isFinite(value)) value = 0;

  const u = (units || "").toLowerCase();
  if (u === "l3bps" || u === "bps") {
    const lab = ["bps", "Kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
    let i = 0;
    while (value >= 1000 && i < lab.length - 1) {
      value /= 1000;
      i++;
    }
    return `${value.toFixed(i === 0 ? 0 : 2)} ${lab[i]}`;
  }
  if (u === "pps") {
    const lab = ["pps", "Kpps", "Mpps", "Gpps"];
    let i = 0;
    while (value >= 1000 && i < lab.length - 1) {
      value /= 1000;
      i++;
    }
    return `${value.toFixed(i === 0 ? 0 : 2)} ${lab[i]}`;
  }
  if (u === "bytes") {
    const lab = ["B", "KB", "MB", "GB", "TB", "PB"];
    let i = 0;
    while (value >= 1024 && i < lab.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value.toFixed(i === 0 ? 0 : 2)} ${lab[i]}`;
  }

  // fallback: número puro
  return String(value);
}

/** Gera DOT (Graphviz) com opção de colorir nós/arestas por nível. */
export function emitDotSankey(
  graph: SankeyNormalized,
  opts: DotThemeOptions = {}
): string {
  const {
    units,
    penwidthMin = 1,
    penwidthScale = 1,
    levelOrder,
    levelColors = [
      "#C7D2FE",
      "#A7F3D0",
      "#FDE68A",
      "#FCA5A5",
      "#D8B4FE",
      "#93C5FD",
    ],
    nodeFillDefault = "#eef5ff",
    rankdir = "LR",
    fontname = "Inter,Arial",
    colorNodesByLevel = true,
    colorEdgesBySourceLevel = false,
    formatValueLabel,
  } = opts;

  const fmt = formatValueLabel ?? defaultFormatValue;

  const { nodes, links } = graph;
  const levels = inferLevelIndex(nodes, levelOrder);

  const colorForLevel = (i: number) => {
    if (i == null || i < 0) return nodeFillDefault;
    const idx = i % levelColors.length;
    return levelColors[idx] || nodeFillDefault;
  };

  const esc = (s: string) => String(s).replace(/"/g, '\\"');

  let dot = `digraph Sankey {\n`;
  dot += `  rankdir=${rankdir};\n`;
  dot += `  node [shape=box, style="rounded,filled", fillcolor="${nodeFillDefault}", fontname="${esc(
    fontname
  )}"];\n`;

  // Nós
  for (let i = 0; i < nodes.length; i++) {
    const label = esc(nodes[i]);
    const fill = colorNodesByLevel ? colorForLevel(levels[i]) : nodeFillDefault;
    dot += `  n${i} [label="${label}", fillcolor="${fill}"];\n`;
  }

  // Arestas
  for (const { source, target, value } of links) {
    const v = toNumber(value, 0);
    const pen = Math.max(penwidthMin, Math.log10(v + 1) * penwidthScale);
    const lbl = esc(fmt(v, units));
    const edgeColor = colorEdgesBySourceLevel
      ? colorForLevel(levels[source])
      : "#7c8ea3";
    // AQUI é a parte crítica: usa os índices!
    dot += `  n${source} -> n${target} [label="${lbl}", penwidth=${pen.toFixed(
      2
    )}, color="${edgeColor}"];\n`;
  }

  dot += `}\n`;
  return dot;
}
