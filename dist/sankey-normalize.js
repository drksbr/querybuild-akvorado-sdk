"use strict";
// src/sankey-normalize.ts
// Normalização de Sankey + emissor DOT com tema por nível (dimensão)
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSankey = normalizeSankey;
exports.labelPrefix = labelPrefix;
exports.inferLevelIndex = inferLevelIndex;
exports.emitDotSankey = emitDotSankey;
/** Converte qualquer valor numérico possível para number seguro (>=0). */
function toNumber(x, def = 0) {
    const n = Number(x);
    if (!Number.isFinite(n) || Number.isNaN(n))
        return def;
    return n;
}
/** Normaliza: aceita "nodes+links" OU "rows+values", agrega arestas e valida índices. */
function normalizeSankey(raw) {
    // --- Formato 1: nodes + links ---
    if ("nodes" in raw && "links" in raw) {
        const nodes = raw.nodes.slice();
        const linksAgg = new Map(); // "s->t" => value
        for (const l of raw.links) {
            // fallback de campos para o valor
            const val = l.value ??
                l.weight ??
                l.bytes ??
                l.count ??
                l.v ??
                0;
            const source = toNumber(l.source, -1);
            const target = toNumber(l.target, -1);
            if (!Number.isInteger(source) || !Number.isInteger(target))
                continue;
            if (source < 0 ||
                target < 0 ||
                source >= nodes.length ||
                target >= nodes.length)
                continue;
            const key = `${source}->${target}`;
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
        // aceita 'values' | 'weights' | 'v'
        const vals = raw.values ??
            raw.weights ??
            raw.v ??
            new Array(rows.length).fill(0);
        const labelToIndex = new Map();
        const nodes = [];
        const linksAgg = new Map();
        const idx = (label) => {
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
            if (!Array.isArray(path) || path.length < 2)
                return;
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
function labelPrefix(label) {
    const m = String(label).match(/^\s*([^:]+)\s*:/);
    return m ? m[1].trim() : "";
}
/**
 * Mapeia cada nó a um índice de nível (0,1,2,...) com base na ordem de `levelOrder`.
 * Se `levelOrder` não for passado, usa a ordem em que novos prefixos aparecem nos rótulos.
 */
function inferLevelIndex(nodes, levelOrder) {
    const order = [];
    const prefixToLevel = new Map();
    const ensureLevel = (p) => {
        if (!p)
            return -1;
        let i = prefixToLevel.get(p);
        if (i == null) {
            i = levelOrder ? levelOrder.indexOf(p) : order.push(p) - 1;
            if (i < 0 && levelOrder) {
                // prefixo não está em levelOrder → empilha no final
                i =
                    levelOrder.length +
                        Array.from(prefixToLevel.values()).filter((x) => x >= levelOrder.length).length;
            }
            prefixToLevel.set(p, i);
        }
        return i;
    };
    return nodes.map((label) => ensureLevel(labelPrefix(label)));
}
/** Formata valores conforme unidade "comum". */
function defaultFormatValue(value, units) {
    if (!Number.isFinite(value))
        value = 0;
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
function emitDotSankey(graph, opts = {}) {
    const { units, penwidthMin = 1, penwidthScale = 1, levelOrder, levelColors = [
        "#C7D2FE",
        "#A7F3D0",
        "#FDE68A",
        "#FCA5A5",
        "#D8B4FE",
        "#93C5FD",
    ], nodeFillDefault = "#eef5ff", rankdir = "LR", fontname = "Inter,Arial", colorNodesByLevel = true, colorEdgesBySourceLevel = false, formatValueLabel, } = opts;
    const fmt = formatValueLabel ?? defaultFormatValue;
    const { nodes, links } = graph;
    const levels = inferLevelIndex(nodes, levelOrder);
    const colorForLevel = (i) => {
        if (i == null || i < 0)
            return nodeFillDefault;
        const idx = i % levelColors.length;
        return levelColors[idx] || nodeFillDefault;
    };
    const esc = (s) => String(s).replace(/"/g, '\\"');
    let dot = `digraph Sankey {\n`;
    dot += `  rankdir=${rankdir};\n`;
    dot += `  node [shape=box, style="rounded,filled", fillcolor="${nodeFillDefault}", fontname="${esc(fontname)}"];\n`;
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
        dot += `  n${source} -> n${target} [label="${lbl}", penwidth=${pen.toFixed(2)}, color="${edgeColor}"];\n`;
    }
    dot += `}\n`;
    return dot;
}
//# sourceMappingURL=sankey-normalize.js.map