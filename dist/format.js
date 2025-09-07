"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtBps = fmtBps;
exports.fmtPps = fmtPps;
exports.fmtBytes = fmtBytes;
function fmtBps(v) {
    if (v == null)
        return "-";
    const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
    let i = 0;
    while (v >= 1000 && i < units.length - 1) {
        v /= 1000;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
function fmtPps(v) {
    if (v == null)
        return "-";
    const units = ["pps", "Kpps", "Mpps", "Gpps"];
    let i = 0;
    while (v >= 1000 && i < units.length - 1) {
        v /= 1000;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
function fmtBytes(v) {
    if (v == null)
        return "-";
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}
//# sourceMappingURL=format.js.map