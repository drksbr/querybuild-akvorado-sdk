"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoint = exports.LimitType = exports.Units = exports.Dimension = void 0;
// Dimensões fornecidas por você
var Dimension;
(function (Dimension) {
    Dimension["ExporterAddress"] = "ExporterAddress";
    Dimension["ExporterName"] = "ExporterName";
    Dimension["ExporterGroup"] = "ExporterGroup";
    Dimension["ExporterRole"] = "ExporterRole";
    Dimension["ExporterSite"] = "ExporterSite";
    Dimension["ExporterRegion"] = "ExporterRegion";
    Dimension["ExporterTenant"] = "ExporterTenant";
    Dimension["SrcAddr"] = "SrcAddr";
    Dimension["DstAddr"] = "DstAddr";
    Dimension["SrcNetPrefix"] = "SrcNetPrefix";
    Dimension["DstNetPrefix"] = "DstNetPrefix";
    Dimension["SrcAS"] = "SrcAS";
    Dimension["DstAS"] = "DstAS";
    Dimension["SrcNetName"] = "SrcNetName";
    Dimension["DstNetName"] = "DstNetName";
    Dimension["SrcNetRole"] = "SrcNetRole";
    Dimension["DstNetRole"] = "DstNetRole";
    Dimension["SrcNetSite"] = "SrcNetSite";
    Dimension["DstNetSite"] = "DstNetSite";
    Dimension["SrcNetRegion"] = "SrcNetRegion";
    Dimension["DstNetRegion"] = "DstNetRegion";
    Dimension["SrcNetTenant"] = "SrcNetTenant";
    Dimension["DstNetTenant"] = "DstNetTenant";
    Dimension["SrcCountry"] = "SrcCountry";
    Dimension["DstCountry"] = "DstCountry";
    Dimension["SrcGeoCity"] = "SrcGeoCity";
    Dimension["DstGeoCity"] = "DstGeoCity";
    Dimension["SrcGeoState"] = "SrcGeoState";
    Dimension["DstGeoState"] = "DstGeoState";
    Dimension["DstASPath"] = "DstASPath";
    Dimension["Dst1stAS"] = "Dst1stAS";
    Dimension["Dst2ndAS"] = "Dst2ndAS";
    Dimension["Dst3rdAS"] = "Dst3rdAS";
    Dimension["DstCommunities"] = "DstCommunities";
    Dimension["InIfName"] = "InIfName";
    Dimension["OutIfName"] = "OutIfName";
    Dimension["InIfDescription"] = "InIfDescription";
    Dimension["OutIfDescription"] = "OutIfDescription";
    Dimension["InIfSpeed"] = "InIfSpeed";
    Dimension["OutIfSpeed"] = "OutIfSpeed";
    Dimension["InIfConnectivity"] = "InIfConnectivity";
    Dimension["OutIfConnectivity"] = "OutIfConnectivity";
    Dimension["InIfProvider"] = "InIfProvider";
    Dimension["OutIfProvider"] = "OutIfProvider";
    Dimension["InIfBoundary"] = "InIfBoundary";
    Dimension["OutIfBoundary"] = "OutIfBoundary";
    Dimension["EType"] = "EType";
    Dimension["Proto"] = "Proto";
    Dimension["SrcPort"] = "SrcPort";
    Dimension["DstPort"] = "DstPort";
    Dimension["PacketSizeBucket"] = "PacketSizeBucket";
    Dimension["ForwardingStatus"] = "ForwardingStatus";
    Dimension["TCPFlags"] = "TCPFlags";
})(Dimension || (exports.Dimension = Dimension = {}));
// unidades/métricas mais comuns do console
var Units;
(function (Units) {
    Units["L2Bps"] = "l2bps";
    Units["L3Bps"] = "l3bps";
    Units["PPS"] = "pps";
})(Units || (exports.Units = Units = {}));
// tipo de limite (ex.: top-n por média, pico, soma, etc.)
var LimitType;
(function (LimitType) {
    LimitType["Avg"] = "avg";
    LimitType["Max"] = "max";
    LimitType["Sum"] = "sum";
    LimitType["P95"] = "p95";
})(LimitType || (exports.LimitType = LimitType = {}));
// endpoints conhecidos/padrão
var Endpoint;
(function (Endpoint) {
    Endpoint["GraphLine"] = "/api/v0/console/graph/line";
    Endpoint["GraphSankey"] = "/api/v0/console/graph/sankey";
})(Endpoint || (exports.Endpoint = Endpoint = {}));
//# sourceMappingURL=enums.js.map