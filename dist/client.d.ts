import type { BaseQuery, LineResponse, SankeyRaw } from "./types";
export declare class FlowApiClient {
    private opts;
    constructor(opts: {
        baseUrl: string;
        authToken?: string;
        defaultHeaders?: HeadersInit;
        timeoutMs?: number;
        fetchImpl?: typeof fetch;
    });
    setAuthToken(token?: string): void;
    private headers;
    private withTimeout;
    private post;
    /** Série temporal (lines/stacked/grid no console) */
    graphLine(payload: BaseQuery, init?: {
        headers?: HeadersInit;
        signal?: AbortSignal;
    }): Promise<LineResponse>;
    /** Sankey (distribuição entre dimensões em múltiplos níveis) */
    graphSankey(payload: BaseQuery, init?: {
        headers?: HeadersInit;
        signal?: AbortSignal;
    }): Promise<SankeyRaw>;
}
//# sourceMappingURL=client.d.ts.map