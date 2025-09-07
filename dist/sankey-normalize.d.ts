export type SankeyRaw = {
    nodes: string[];
    links: Array<{
        source: number;
        target: number;
        value?: number;
        weight?: number;
        bytes?: number;
        count?: number;
        v?: number;
    }>;
    meta?: Record<string, unknown>;
} | {
    rows: string[][];
    values?: number[];
    weights?: number[];
    v?: number[];
    meta?: Record<string, unknown>;
};
export interface SankeyNormalized {
    nodes: string[];
    links: {
        source: number;
        target: number;
        value: number;
    }[];
}
/** Normaliza: aceita "nodes+links" OU "rows+values", agrega arestas e valida índices. */
export declare function normalizeSankey(raw: SankeyRaw): SankeyNormalized;
/**
 * Extrai o "prefixo" (antes do primeiro ':') do rótulo de um nó.
 * Ex.: "SrcAS: 15169: Google" -> "SrcAS"
 */
export declare function labelPrefix(label: string): string;
/**
 * Mapeia cada nó a um índice de nível (0,1,2,...) com base na ordem de `levelOrder`.
 * Se `levelOrder` não for passado, usa a ordem em que novos prefixos aparecem nos rótulos.
 */
export declare function inferLevelIndex(nodes: string[], levelOrder?: string[]): number[];
export interface DotThemeOptions {
    /** Unidade semântica para o label (ex.: 'l3bps'|'pps'|'bytes'|...). Só afeta o texto do label. */
    units?: string;
    /** Largura mínima do traço. */
    penwidthMin?: number;
    /** Fator de escala da largura do traço: penwidth = max(min, log10(value+1) * scale). */
    penwidthScale?: number;
    /** Ordem dos níveis (dimensões) para pintar cores por nível. Ex.: ['SrcAS','ExporterAddress'] */
    levelOrder?: string[];
    /** Paleta de cores por nível (hex). Será ciclada se faltar cor. */
    levelColors?: string[];
    /** Cor padrão do nó quando não há nível (ou não quis pintar). */
    nodeFillDefault?: string;
    /** Direção do fluxo no DOT. */
    rankdir?: "LR" | "RL" | "TB" | "BT";
    /** Nome da fonte dos nós. */
    fontname?: string;
    /** Pintar nós por nível? */
    colorNodesByLevel?: boolean;
    /** Pintar arestas com cor do nível de origem? */
    colorEdgesBySourceLevel?: boolean;
    /** Formatação custom do label de valor (sobrescreve units). */
    formatValueLabel?: (value: number, units?: string) => string;
}
/** Gera DOT (Graphviz) com opção de colorir nós/arestas por nível. */
export declare function emitDotSankey(graph: SankeyNormalized, opts?: DotThemeOptions): string;
//# sourceMappingURL=sankey-normalize.d.ts.map