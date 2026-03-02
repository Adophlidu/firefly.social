# `timeout`

Races a promise against a timer. If the promise does not settle within the given time, the returned promise rejects with an error.

## Usage

```typescript
import { timeout } from '@dimensiondev/utils';

const data = await timeout(fetch('/api/data'), 5000);
```

Custom rejection message:

```typescript
const result = await timeout(
    longRunningOperation(),
    10_000,
    'Operation exceeded 10 s limit',
);
```

Non-finite `time` disables the timeout (useful for conditional timeouts):

```typescript
const ms = isProduction ? 3000 : Infinity;
const data = await timeout(fetchData(), ms);
```

## Reference

```typescript
function timeout<T>(
    promise: PromiseLike<T>,
    time: number,
    rejectReason?: string,
): Promise<T>;
```

- `promise` — the promise to race against the timer.
- `time` — milliseconds before the timeout fires. If `time` is not finite (`Infinity`, `NaN`), the original promise is returned unwrapped with no timeout applied.
- `rejectReason` — message for the rejection `Error`. Defaults to `'timeout'`.
- Returns a `Promise<T>` that resolves with the original value or rejects with a timeout error.

## Notes

- The internal `setTimeout` handle is always cleared via `finally`, preventing timer leaks regardless of whether the promise resolves or rejects first.
- The original `promise` is not cancelled when the timeout fires — ongoing work continues in the background. Use [`anySignal`](./anySignal.md) with an `AbortController` for cooperative cancellation.
- Combine with [`retry`](./retry.md) to add per-attempt time limits to retried operations.
