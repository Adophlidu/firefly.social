# `compose`

Applies a list of transformation functions to an initial value from **right to left**, returning the final result.

## Usage

```typescript
import { compose } from '@dimensiondev/utils';

const result = compose(
    (x: number) => x * 2, // applied third
    (x: number) => x + 10, // applied second
    (x: number) => x - 1, // applied first
    5, // initial value
);
// → ((5 - 1) + 10) * 2 === 28
```

Middleware-style composition:

```typescript
const processRequest = compose(
    addAuthHeader,
    addCorrelationId,
    normalizeHeaders,
    baseRequest,
);
```

Skip steps conditionally with `null` or `false`:

```typescript
const pipeline = compose(
    transform,
    isDebug && addDebugInfo, // skipped when isDebug is false
    validate,
    rawData,
);
```

## Reference

```typescript
function compose<T>(
    ...args: [
        ...composers: Array<((arg: T) => T) | null | false>,
        init: T,
    ]
): T;
```

- `args` — a list ending with an **initial value** (`init`), preceded by any number of transformer functions `(arg: T) => T`.
- `null` and `false` entries in the composer list are filtered out and skipped.
- Returns the value produced by threading `init` through all non-null composers right-to-left.
- Throws `TypeError` if called with no arguments.

## Notes

- All functions in the pipeline must share the same type `T` — input and output types are identical.
- Functions are applied right-to-left (the last function runs first on the initial value). This matches mathematical function composition: `f(g(x))`.
- For left-to-right (pipeline) style, reverse your function order.
