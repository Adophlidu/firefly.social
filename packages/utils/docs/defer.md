# `defer`

Creates a promise together with its external `resolve` and `reject` handles, so the settlement can be triggered from outside the promise constructor.

## Usage

```typescript
import { defer } from '@dimensiondev/utils';

const [promise, resolve, reject] = defer<string>();

// Pass `promise` to a consumer
render(<Loader onReady={promise} />);

// Settle it from elsewhere
fetchData()
    .then((data) => resolve(data))
    .catch((err) => reject(err));
```

Waiting for a user action:

```typescript
async function waitForConfirmation() {
    const [promise, resolve, reject] = defer<boolean>();

    showDialog({
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        onError: (e) => reject(e),
    });

    return promise;
}

const confirmed = await waitForConfirmation();
```

## Reference

```typescript
type DeferTuple<T, E = unknown> = [
    Promise<T>,
    (value: T | PromiseLike<T>) => void,
    (reason: E) => void,
];

function defer<T, E = unknown>(): DeferTuple<T, E>;
```

- Returns a 3-tuple `[promise, resolve, reject]`:
    - `promise` — the deferred `Promise<T>`.
    - `resolve` — call with a value (or another promise) to fulfil `promise`.
    - `reject` — call with a reason to reject `promise`.

## Notes

- Settling the same deferred multiple times has no effect (standard Promise behaviour).
- The generic `E` on `reject` defaults to `unknown`; narrow it for typed error handling.
