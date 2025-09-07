Hi everyone! 👋

I've been working on a **TypeScript SDK for Akvorado** that helps other platforms integrate with Akvorado for network flow analysis. The library focuses on simplifying the interaction between external applications and Akvorado's API. The project is now available on npm as `querybuild-akvorado-sdk`.

## What it does

- Enables easy integration between external platforms and Akvorado
- Provides a query builder pattern for Akvorado API
- Generates Sankey diagrams from flow data
- Handles data formatting and normalization
- Full TypeScript support for better developer experience

## Quick example

```typescript
import { QueryBuilder, FlowApiClient, Dimension, Units } from "querybuild-akvorado-sdk";

const query = QueryBuilder.lastHours(1)
  .dimensions(Dimension.SrcAS, Dimension.DstAS)
  .filter("InIfBoundary = external")
  .units(Units.L3Bps)
  .limit(10)
  .build();

const results = await client.graphLine(query);
```

## Installation

```bash
npm install querybuild-akvorado-sdk
```

## Looking for feedback & contributors

I'd love to get feedback from the community, especially from those working with Akvorado. Whether you:

- Have ideas for new features
- Found bugs or issues
- Want to contribute code
- Have suggestions for improvements

All feedback is welcome! The project is open source and I'm happy to collaborate.

**Repository**: [flow-sdk](https://github.com/drksbr/flow-sdk)
**NPM Package**: [querybuild-akvorado-sdk](https://www.npmjs.com/package/querybuild-akvorado-sdk)

Thanks for checking it out! 🙏
