# `attemptUntil`

Tries a list of async functions one by one until one returns a value that passes the predicate. Returns a `fallback` if all attempts fail or produce invalid results.

Also exports [`createPredicate`](#createpredicate) for building membership predicates.

## Usage

```typescript
import { attemptUntil } from '@dimensiondev/utils';

const result = await attemptUntil(
    [
        () => fetchFromCDN('/data.json'),
        () => fetchFromMirror('/data.json'),
        () => fetchFromLocal('/data.json'),
    ],
    null, // fallback when all fail
);
```

Custom predicate — skip results that don't pass validation:

```typescript
const profile = await attemptUntil(
    [
        () => fetchTwitterProfile(handle),
        () => fetchFarcasterProfile(handle),
    ],
    defaultProfile,
    (result) =>
        result === undefined || result.avatarUrl === '',
);
// Keeps trying until a profile with an avatarUrl is found
```

Only throw when **all** attempts fail:

```typescript
const data = await attemptUntil(
    [fetchA, fetchB, fetchC],
    null,
    undefined,
    true, // onlyThrowWhenAllFails
);
```

## Reference

```typescript
async function attemptUntil<T>(
    funcs: Array<() => Promise<T> | undefined>,
    fallback: T,
    predicator?: (
        result: Awaited<T> | undefined,
    ) => boolean,
    onlyThrowWhenAllFails?: boolean,
): Promise<T | undefined>;
```

- `funcs` — ordered list of async factory functions to try.
- `fallback` — value returned when every attempt is skipped or throws.
- `predicator` — called with each result; return `true` to skip to the next attempt. Defaults to `(x) => x === undefined`.
- `onlyThrowWhenAllFails` — when `true`, an `AggregateError` is thrown only if **every** function threw. When `false` (default), throws if **any** function threw.
- Returns the first accepted result, or `fallback`.

---

## `createPredicate`

Creates a membership predicate that checks whether a candidate is in a given list.

### Usage

```typescript
import { createPredicate } from '@dimensiondev/utils';

const isSupported = createPredicate([
    'twitter',
    'farcaster',
    'lens',
]);

isSupported('twitter'); // true
isSupported('mastodon'); // false
```

### Reference

```typescript
function createPredicate<T, P extends T>(
    candidates: T[],
): (candidate?: unknown) => candidate is P;
```

- `candidates` — the allowed values.
- Returns a type-guard function narrowing the argument to `P`.
