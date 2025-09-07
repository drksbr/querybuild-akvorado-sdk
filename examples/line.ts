// examples/line.ts
import { FlowApiClient } from "../src/client";
import { QueryBuilder } from "../src/builder";
import { Dimension, Units, LimitType } from "../src/enums";
import { fmtBps } from "../src/format";

// params simples via env (pra não depender de lib de CLI)
const BASE_URL =
  process.env.FLOW_BASE_URL ?? "https://flow.provedorveloz.com.br";
const FILTER = process.env.FLOW_FILTER ?? "InIfBoundary = external";
const DIMS = (process.env.FLOW_DIMS ?? "SrcAS").split(
  ","
) as (keyof typeof Dimension)[];
const MINUTES = Number(process.env.FLOW_MINUTES ?? 30);
const LIMIT = Number(process.env.FLOW_LIMIT ?? 12);
const UNITS = (process.env.FLOW_UNITS ?? "l3bps") as Units;

const api = new FlowApiClient({ baseUrl: BASE_URL, timeoutMs: 30_000 });

const q = QueryBuilder.lastMinutes(MINUTES)
  .dimensions(...DIMS.map((d) => Dimension[d]))
  .filter(FILTER)
  .units(UNITS as Units)
  .points(120)
  .limit(LIMIT, LimitType.Avg)
  .truncate(32, 128)
  .build();

async function main() {
  const resp = await api.graphLine(q);

  // imprime resumo enxuto
  resp.rows.forEach((row: any[], i: number) => {
    const label = row.join(" · ");
    const avg = resp.average?.[i];
    const max = resp.max?.[i];
    const last = resp.last?.[i];
    console.log(
      label.padEnd(28),
      "| avg=",
      fmtBps(avg),
      "max=",
      fmtBps(max),
      "last=",
      fmtBps(last)
    );
  });
}

main().catch(console.error);
