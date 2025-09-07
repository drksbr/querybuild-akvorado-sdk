import { Endpoint } from "./enums";
import type { BaseQuery, LineResponse, SankeyRaw } from "./types";

export class FlowApiClient {
  constructor(
    private opts: {
      baseUrl: string;
      authToken?: string;
      defaultHeaders?: HeadersInit;
      timeoutMs?: number;
      fetchImpl?: typeof fetch;
    }
  ) {
    this.opts.baseUrl = this.opts.baseUrl.replace(/\/+$/, "");
  }

  setAuthToken(token?: string) {
    this.opts.authToken = token;
  }

  private headers(extra?: HeadersInit): HeadersInit {
    const h: HeadersInit = {
      accept: "*/*",
      "content-type": "application/json",
      ...(this.opts.defaultHeaders ?? {}),
      ...(extra ?? {}),
    };
    if (this.opts.authToken)
      (h as any).authorization = `Bearer ${this.opts.authToken}`;
    return h;
  }

  private withTimeout(signal?: AbortSignal) {
    if (!this.opts.timeoutMs) return signal;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.opts.timeoutMs);
    signal?.addEventListener("abort", () => ctrl.abort(), { once: true });
    return ctrl.signal;
  }

  private async post<T>(
    path: string,
    body: unknown,
    init?: { headers?: HeadersInit; signal?: AbortSignal }
  ): Promise<T> {
    const url = `${this.opts.baseUrl}${path}`;
    const res = await (this.opts.fetchImpl ?? fetch)(url, {
      method: "POST",
      headers: this.headers(init?.headers),
      body: JSON.stringify(body),
      signal: this.withTimeout(init?.signal),
    });
    if (!res.ok)
      throw new Error(
        `HTTP ${res.status} ${res.statusText} — ${await res
          .text()
          .catch(() => "")}`
      );
    return res.json() as Promise<T>;
  }

  /** Série temporal (lines/stacked/grid no console) */
  graphLine(
    payload: BaseQuery,
    init?: { headers?: HeadersInit; signal?: AbortSignal }
  ) {
    return this.post<LineResponse>(Endpoint.GraphLine, payload, init);
  }

  /** Sankey (distribuição entre dimensões em múltiplos níveis) */
  graphSankey(
    payload: BaseQuery,
    init?: { headers?: HeadersInit; signal?: AbortSignal }
  ) {
    // dica: para sankey, não envie points/previous-period (o backend ignora)
    const { points, ["previous-period"]: _pp, ...rest } = payload as any;
    return this.post<SankeyRaw>(Endpoint.GraphSankey, rest, init);
  }
}
