import { BaseQuery } from "./types";
import { Dimension, Units, LimitType } from "./enums";
export declare class QueryBuilder {
    private q;
    constructor(start?: string, end?: string);
    static last(ms: number): QueryBuilder;
    static lastMinutes(n: number): QueryBuilder;
    static lastHours(n: number): QueryBuilder;
    static range(start: Date | number | string, end: Date | number | string): QueryBuilder;
    dimensions(...d: Dimension[]): this;
    filter(expr: string): this;
    units(u: Units): this;
    points(n: number): this;
    previousPeriod(flag?: boolean): this;
    limit(n: number, type?: LimitType): this;
    truncate(v4?: number, v6?: number): this;
    bidirectional(flag?: boolean): this;
    build(): BaseQuery;
}
//# sourceMappingURL=builder.d.ts.map