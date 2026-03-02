# `anySignal`

Combines multiple `AbortSignal`s into a single signal that aborts when **any** of the provided signals abort.

## Usage

```typescript
import { anySignal } from '@dimensiondev/utils';

const controller1 = new AbortController();
const controller2 = new AbortController();

const combined = anySignal(
    controller1.signal,
    controller2.signal,
);

fetch('/api/data', { signal: combined });

// Aborting either controller will abort the fetch
controller1.abort();
```

Accepts `null` values for optional signals:

```typescript
const userSignal = user.signal ?? null;
const combined = anySignal(timeoutSignal, userSignal);
```

## Reference

```typescript
function anySignal(
    ...signals: Array<AbortSignal | null>
): AbortSignal;
```

- `signals` — one or more `AbortSignal` instances or `null` values to combine.
- Returns an `AbortSignal` that aborts as soon as any input signal aborts.

## Notes

- If any of the provided signals is already aborted at call time, the returned signal aborts immediately.
- Event listeners are cleaned up when the combined signal aborts, preventing memory leaks.
- `null` values are safely ignored.
