# `delay`

Returns a `Promise` that resolves after the given number of milliseconds.

## Usage

```typescript
import { delay } from '@dimensiondev/utils';

await delay(1000); // wait 1 second

// Inside a retry loop
for (let i = 0; i < 3; i++) {
    try {
        return await fetchData();
    } catch {
        await delay(500 * (i + 1)); // exponential-ish back-off
    }
}
```

## Reference

```typescript
function delay(time: number): Promise<void>;
```

- `time` — milliseconds to wait before the promise resolves.
- If `time` is not a finite number (`Infinity`, `NaN`, etc.), the promise **never resolves** — use with care.
- Returns `Promise<void>`.

## Notes

- Combine with [`retry`](./retry.md) for resilient async operations with built-in back-off.
- Combine with [`timeout`](./timeout.md) to set an upper bound on how long to wait.
- `delay(0)` defers resolution to the next microtask/macrotask boundary without blocking.
