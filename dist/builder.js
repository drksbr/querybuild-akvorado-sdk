"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
const enums_1 = require("./enums");
class QueryBuilder {
    q;
    constructor(start, end) {
        const now = new Date();
        this.q = {
            start: start ?? new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
            end: end ?? now.toISOString(),
        };
    }
    static last(ms) {
        const end = new Date();
        const start = new Date(end.getTime() - ms);
        return new QueryBuilder(start.toISOString(), end.toISOString());
    }
    static lastMinutes(n) {
        const end = new Date();
        const start = new Date(end.getTime() - n * 60_000);
        return new QueryBuilder(start.toISOString(), end.toISOString());
    }
    static lastHours(n) {
        const end = new Date();
        const start = new Date(end.getTime() - n * 3_600_000);
        return new QueryBuilder(start.toISOString(), end.toISOString());
    }
    static range(start, end) {
        const s = new Date(start).toISOString();
        const e = new Date(end).toISOString();
        return new QueryBuilder(s, e);
    }
    dimensions(...d) {
        this.q.dimensions = d;
        return this;
    }
    filter(expr) {
        this.q.filter = expr;
        return this;
    }
    units(u) {
        this.q.units = u;
        return this;
    }
    points(n) {
        this.q.points = n;
        return this;
    } // line
    previousPeriod(flag = true) {
        this.q["previous-period"] = flag;
        return this;
    } // line
    limit(n, type = enums_1.LimitType.Avg) {
        this.q.limit = n;
        this.q.limitType = type;
        return this;
    }
    truncate(v4, v6) {
        if (v4)
            this.q["truncate-v4"] = v4;
        if (v6)
            this.q["truncate-v6"] = v6;
        return this;
    }
    bidirectional(flag = true) {
        this.q.bidirectional = flag;
        return this;
    }
    build() {
        return { ...this.q };
    }
}
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=builder.js.map