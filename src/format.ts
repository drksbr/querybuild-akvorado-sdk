// src/format.ts
export function fmtBps(v?: number) {
  if (v == null) return "-";
  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
export function fmtPps(v?: number) {
  if (v == null) return "-";
  const units = ["pps", "Kpps", "Mpps", "Gpps"];
  let i = 0;
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
export function fmtBytes(v?: number) {
  if (v == null) return "-";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
