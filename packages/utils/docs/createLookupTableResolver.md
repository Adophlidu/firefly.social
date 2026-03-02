# `createLookupTableResolver`

Creates a resolver function that maps known keys to values using a lookup table, with a fallback for unrecognised keys.

## Usage

```typescript
import { createLookupTableResolver } from '@dimensiondev/utils';

const resolveLabel = createLookupTableResolver(
    {
        twitter: 'Twitter / X',
        farcaster: 'Farcaster',
        lens: 'Lens Protocol',
    },
    'Unknown Platform',
);

resolveLabel('twitter'); // 'Twitter / X'
resolveLabel('lens'); // 'Lens Protocol'
resolveLabel('bluesky'); // 'Unknown Platform'
```

Dynamic fallback with a function:

```typescript
const resolveColor = createLookupTableResolver(
    {
        error: '#ff4444',
        success: '#44ff44',
        warning: '#ffaa00',
    },
    (key) => `var(--color-${key})`, // generates a CSS variable for unknown keys
);

resolveColor('error'); // '#ff4444'
resolveColor('info'); // 'var(--color-info)'
```

## Reference

```typescript
function createLookupTableResolver<K extends keyof any, T>(
    map: Record<K, T>,
    fallback: T | ((key: K) => T),
): (key: K) => T;
```

- `map` — a plain object mapping keys to their resolved values.
- `fallback` — either a static value or a function `(key: K) => T` called when the key is not found in `map`.
- Returns a resolver function `(key: K) => T`.

## Notes

- Lookup uses the `??` operator, so map values of `null` or `undefined` will fall through to the fallback.
- Combine with TypeScript enums or union types for exhaustive, type-safe resolvers.
