export type Alert = {
  kind: string;
  summary: string;
  severity: "low" | "medium" | "high";
};
export type Legend = { curr?: string; prev?: string };
export type PpsSeries = {
  times: string[];
  totals: number[];
  prevTotals?: number[];
  avg: number;
  last: number;
  ratioApprox: number;
  legend?: Legend;
};
export type TopRow = { dst: string; ppsAvg: number; share: number };
export type TopPort = { port: string; ppsAvg: number; share: number };

export type SynAckStats = {
  pps: PpsSeries;
  topDst: TopRow[];
};

// SDK types
export interface BaseQuery {
  [key: string]: any;
}

export interface LineResponse {
  [key: string]: any;
}

export interface SankeyRaw {
  rows?: string[][];
  values?: number[];
  weights?: number[];
  v?: number[];
  meta?: Record<string, unknown>;
  [key: string]: any;
}

export type TcpFlagBundle = {
  syn: PpsSeries;
  synack: PpsSeries;
  ack: PpsSeries;
  rst: PpsSeries;
};
