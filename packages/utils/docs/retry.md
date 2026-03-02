# `retry`

Retries an async operation up to a maximum number of times, waiting between attempts. Only retries on `InvalidResultError`; other errors are rethrown immediately.

## Usage

```typescript
import { retry } from '@dimensiondev/utils';

const data = await retry(async () => {
    const result = await fetchData();
    if (!result.ok)
        throw new InvalidResultError('Bad response');
    return result.data;
});
```

With custom options:

```typescript
import { retry } from '@dimensiondev/utils';

const status = await retry(
    async (signal) => {
        const res = await fetch('/api/status', { signal });
        const json = await res.json();
        if (json.status !== 'ready')
            throw new InvalidResultError();
        return json;
    },
    { times: 10, interval: 5000 },
);
```

With an `AbortSignal` to cancel retrying:

```typescript
const controller = new AbortController();

const result = await retry(
    (signal) => pollJobStatus(jobId, signal),
    {
        times: 30,
        interval: 2000,
        signal: controller.signal,
    },
);

// Cancel from elsewhere
controller.abort();
```

## Reference

```typescript
interface RetryOptions {
    times?: number;
    interval?: number;
    signal?: AbortSignal;
}

async function retry<T>(
    callback: (signal?: AbortSignal) => Promise<T>,
    options?: RetryOptions,
): Promise<T>;
```

- `callback` — async function to execute. Receives the `AbortSignal` from `options.signal` so it can propagate cancellation.
- `options.times` — maximum number of attempts. Defaults to `60`.
- `options.interval` — milliseconds between attempts. Defaults to `2000`.
- `options.signal` — `AbortSignal` to stop retrying early; throws `AbortError` when triggered.
- Returns the result of the first successful `callback` invocation.
- Throws `InvalidResultError` after exhausting all attempts without success.

## Notes

- Only `InvalidResultError` triggers a retry. Any other error thrown by `callback` is re-thrown immediately without further attempts.
- If `signal` is aborted between attempts, an `AbortError` is thrown instead of retrying.
- See [`InvalidResultError`](./error.md#invalidresulterror) for signalling retry-worthy failures.
