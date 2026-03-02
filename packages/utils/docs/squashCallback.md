# `squashCallback`

Wraps an async function so that concurrent calls with the same key share a single in-flight promise. Subsequent callers within the expiration window receive the cached promise rather than triggering a new call.

## Usage

```typescript
import { squashCallback } from '@dimensiondev/utils';

const fetchProfile = squashCallback(
    async (userId: string) => {
        return await api.getProfile(userId);
    },
);

// All three calls made within 1 second share the same request
const [a, b, c] = await Promise.all([
    fetchProfile('user-1'),
    fetchProfile('user-1'),
    fetchProfile('user-1'),
]);
```

Custom expiration and key resolver:

```typescript
const fetchFeed = squashCallback(
    async (source: string, page: number) => {
        return await api.getFeed(source, page);
    },
    {
        expiration: 5000, // cache result for 5 s
        resolver: (source, page) => `${source}-${page}`, // custom cache key
    },
);
```

## Reference

```typescript
function squashCallback<
    T extends (...args: unknown[]) => Promise<unknown>,
>(
    callback: T,
    options?: {
        expiration?: number;
        resolver?: (...args: Parameters<T>) => string;
    },
): T;
```

- `callback` — the async function to deduplicate.
- `options.expiration` — milliseconds a cached promise is considered fresh. Defaults to `1000`.
- `options.resolver` — derives a cache key from the arguments. Defaults to `args.join(',')`.
- Returns a wrapped function with an identical signature to `callback`.

## Notes

- The cache is **module-level** (a single `Map` shared across all `squashCallback` instances). Ensure cache keys are unique across different wrapped functions by using a descriptive `resolver`.
- If the underlying promise rejects, the cached entry is removed and the next call will re-invoke `callback`.
- Unlike [`once`](./once.md), concurrent calls are **merged** rather than rejected — they all receive the same promise.
