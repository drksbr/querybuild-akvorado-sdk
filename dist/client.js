"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowApiClient = void 0;
const enums_1 = require("./enums");
class FlowApiClient {
    opts;
    constructor(opts) {
        this.opts = opts;
        this.opts.baseUrl = this.opts.baseUrl.replace(/\/+$/, "");
    }
    setAuthToken(token) {
        this.opts.authToken = token;
    }
    headers(extra) {
        const h = {
            accept: "*/*",
            "content-type": "application/json",
            ...(this.opts.defaultHeaders ?? {}),
            ...(extra ?? {}),
        };
        if (this.opts.authToken)
            h.authorization = `Bearer ${this.opts.authToken}`;
        return h;
    }
    withTimeout(signal) {
        if (!this.opts.timeoutMs)
            return signal;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.opts.timeoutMs);
        signal?.addEventListener("abort", () => ctrl.abort(), { once: true });
        return ctrl.signal;
    }
    async post(path, body, init) {
        const url = `${this.opts.baseUrl}${path}`;
        const res = await (this.opts.fetchImpl ?? fetch)(url, {
            method: "POST",
            headers: this.headers(init?.headers),
            body: JSON.stringify(body),
            signal: this.withTimeout(init?.signal),
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status} ${res.statusText} — ${await res
                .text()
                .catch(() => "")}`);
        return res.json();
    }
    /** Série temporal (lines/stacked/grid no console) */
    graphLine(payload, init) {
        return this.post(enums_1.Endpoint.GraphLine, payload, init);
    }
    /** Sankey (distribuição entre dimensões em múltiplos níveis) */
    graphSankey(payload, init) {
        // dica: para sankey, não envie points/previous-period (o backend ignora)
        const { points, ["previous-period"]: _pp, ...rest } = payload;
        return this.post(enums_1.Endpoint.GraphSankey, rest, init);
    }
}
exports.FlowApiClient = FlowApiClient;
//# sourceMappingURL=client.js.map