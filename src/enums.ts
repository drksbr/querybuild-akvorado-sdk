// Dimensões fornecidas por você
export enum Dimension {
  ExporterAddress = "ExporterAddress",
  ExporterName = "ExporterName",
  ExporterGroup = "ExporterGroup",
  ExporterRole = "ExporterRole",
  ExporterSite = "ExporterSite",
  ExporterRegion = "ExporterRegion",
  ExporterTenant = "ExporterTenant",
  SrcAddr = "SrcAddr",
  DstAddr = "DstAddr",
  SrcNetPrefix = "SrcNetPrefix",
  DstNetPrefix = "DstNetPrefix",
  SrcAS = "SrcAS",
  DstAS = "DstAS",
  SrcNetName = "SrcNetName",
  DstNetName = "DstNetName",
  SrcNetRole = "SrcNetRole",
  DstNetRole = "DstNetRole",
  SrcNetSite = "SrcNetSite",
  DstNetSite = "DstNetSite",
  SrcNetRegion = "SrcNetRegion",
  DstNetRegion = "DstNetRegion",
  SrcNetTenant = "SrcNetTenant",
  DstNetTenant = "DstNetTenant",
  SrcCountry = "SrcCountry",
  DstCountry = "DstCountry",
  SrcGeoCity = "SrcGeoCity",
  DstGeoCity = "DstGeoCity",
  SrcGeoState = "SrcGeoState",
  DstGeoState = "DstGeoState",
  DstASPath = "DstASPath",
  Dst1stAS = "Dst1stAS",
  Dst2ndAS = "Dst2ndAS",
  Dst3rdAS = "Dst3rdAS",
  DstCommunities = "DstCommunities",
  InIfName = "InIfName",
  OutIfName = "OutIfName",
  InIfDescription = "InIfDescription",
  OutIfDescription = "OutIfDescription",
  InIfSpeed = "InIfSpeed",
  OutIfSpeed = "OutIfSpeed",
  InIfConnectivity = "InIfConnectivity",
  OutIfConnectivity = "OutIfConnectivity",
  InIfProvider = "InIfProvider",
  OutIfProvider = "OutIfProvider",
  InIfBoundary = "InIfBoundary",
  OutIfBoundary = "OutIfBoundary",
  EType = "EType",
  Proto = "Proto",
  SrcPort = "SrcPort",
  DstPort = "DstPort",
  PacketSizeBucket = "PacketSizeBucket",
  ForwardingStatus = "ForwardingStatus",
  TCPFlags = "TCPFlags",
}

// unidades/métricas mais comuns do console
export enum Units {
  L2Bps = "l2bps",
  L3Bps = "l3bps",
  PPS = "pps",
}

// tipo de limite (ex.: top-n por média, pico, soma, etc.)
export enum LimitType {
  Avg = "avg",
  Max = "max",
  Sum = "sum",
  P95 = "p95",
}

// endpoints conhecidos/padrão
export enum Endpoint {
  GraphLine = "/api/v0/console/graph/line",
  GraphSankey = "/api/v0/console/graph/sankey",
}
