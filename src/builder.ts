import { BaseQuery } from "./types";
import { Dimension, Units, LimitType } from "./enums";

export class QueryBuilder {
  private q: BaseQuery;

  constructor(start?: string, end?: string) {
    const now = new Date();
    this.q = {
      start: start ?? new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      end: end ?? now.toISOString(),
    };
  }

  static last(ms: number) {
    const end = new Date();
    const start = new Date(end.getTime() - ms);
    return new QueryBuilder(start.toISOString(), end.toISOString());
  }

  static lastMinutes(n: number) {
    const end = new Date();
    const start = new Date(end.getTime() - n * 60_000);
    return new QueryBuilder(start.toISOString(), end.toISOString());
  }

  static lastHours(n: number) {
    const end = new Date();
    const start = new Date(end.getTime() - n * 3_600_000);
    return new QueryBuilder(start.toISOString(), end.toISOString());
  }

  static range(start: Date | number | string, end: Date | number | string) {
    const s = new Date(start).toISOString();
    const e = new Date(end).toISOString();
    return new QueryBuilder(s, e);
  }

  dimensions(...d: Dimension[]) {
    this.q.dimensions = d;
    return this;
  }
  filter(expr: string) {
    this.q.filter = expr;
    return this;
  }
  units(u: Units) {
    this.q.units = u;
    return this;
  }
  points(n: number) {
    this.q.points = n;
    return this;
  } // line
  previousPeriod(flag = true) {
    this.q["previous-period"] = flag;
    return this;
  } // line
  limit(n: number, type: LimitType = LimitType.Avg) {
    this.q.limit = n;
    this.q.limitType = type;
    return this;
  }
  truncate(v4?: number, v6?: number) {
    if (v4) this.q["truncate-v4"] = v4;
    if (v6) this.q["truncate-v6"] = v6;
    return this;
  }
  bidirectional(flag = true) {
    this.q.bidirectional = flag;
    return this;
  }

  build(): BaseQuery {
    return { ...this.q };
  }
}
