# `createBatcher`

Batches individual async requests into grouped fetches to reduce network overhead. Requests made within the same time window are deduplicated and sent together.

## Usage

```typescript
import { createBatcher } from '@dimensiondev/utils';

const fetchUser = createBatcher(
    'fetch-users',
    async (payloads) => {
        // Called once with all accumulated payloads
        const ids = payloads.map((p) => p.id);
        const users = await api.getUsers(ids);
        return Object.fromEntries(
            users.map((u) => [u.id, u]),
        );
    },
    {
        makeKey: (payload) => payload.id,
    },
);

// These three calls are automatically batched into one API request
const [alice, bob, carol] = await Promise.all([
    fetchUser({ id: 'alice' }),
    fetchUser({ id: 'bob' }),
    fetchUser({ id: 'carol' }),
]);
```

Custom batch size and wait window:

```typescript
const fetchProfile = createBatcher(
    'fetch-profiles',
    async (payloads) => {
        /* ... */
    },
    {
        size: 10, // max 10 items per fetch call
        wait: 50, // wait 50 ms to accumulate requests
        makeKey: (p) => p.handle,
        onMissing: (p) => ({
            handle: p.handle,
            name: 'Unknown',
        }),
    },
);
```

## Reference

```typescript
function createBatcher<Payload extends object, Result>(
    name: string,
    fetcher: (
        payloads: Payload[],
    ) => Promise<Record<string, Result>>,
    options: {
        size?: number;
        wait?: number;
        makeKey: (payload: Payload) => string;
        onMissing?: (payload: Payload) => Result;
    },
): (payload: Payload) => Promise<Result | undefined>;
```

### Parameters

- `name` — human-readable identifier used in log output.
- `fetcher` — called with a deduplicated array of payloads. Must return a `Record` mapping each key (produced by `makeKey`) to its result.
- `options.size` — maximum number of unique payloads per `fetcher` invocation. Defaults to `30`.
- `options.wait` — milliseconds to wait before flushing the queue. Defaults to `30`.
- `options.makeKey` — derives a unique string key from a payload, used for deduplication and result lookup.
- `options.onMissing` — called for payloads whose key is absent from the fetcher result. When omitted, `undefined` is resolved for missing items.

### Returns

A function `(payload: Payload) => Promise<Result | undefined>` that queues the payload and resolves with its result once the batch completes.

## Notes

- **Deduplication**: payloads sharing the same key are coalesced — the fetcher receives each key at most once per flush.
- **Chunking**: if unique payloads exceed `size`, the fetcher is called multiple times in parallel and results are merged.
- **Error handling**: if a `fetcher` chunk rejects, that error is logged and the affected payloads resolve to `undefined` (or `onMissing` if provided).
