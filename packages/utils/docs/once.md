# `once`

Wraps an async function so that it cannot be called concurrently. Throws an error if invoked while a previous call with the same key is still in progress.

## Usage

```typescript
import { once } from '@dimensiondev/utils';

const submitForm = once(async (data: FormData) => {
    return await api.post('/submit', data);
});

// First call starts immediately
submitForm(data);

// Second call while first is pending → throws
// Error: "Function with key 'data' is still running"
submitForm(data);
```

Custom key resolver for per-user serialisation:

```typescript
const loadProfile = once(
    async (userId: string) => {
        return await api.getProfile(userId);
    },
    {
        resolver: (userId) => userId, // each userId has its own lock
    },
);

// These run concurrently (different keys)
loadProfile('user-1');
loadProfile('user-2');

// This throws — user-1 is already in flight
loadProfile('user-1');
```

## Reference

```typescript
function once<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options?: {
        resolver?: (...args: T) => string;
    },
): (...args: T) => Promise<R>;
```

- `fn` — the async function to protect.
- `options.resolver` — derives a string key from the call arguments. When omitted, the key is `args.join('_')`.
- Returns a wrapped function with the same signature as `fn`.

## Notes

- The lock is **per-key**; calls with different keys can run simultaneously.
- The lock is released in a `finally` block, so it is always cleared even if `fn` rejects.
- Unlike memoisation, each call executes the wrapped function freshly once the previous invocation completes. Results are **not** cached.
- Use [`squashCallback`](./squashCallback.md) if you need in-flight request sharing (returning the same promise to concurrent callers) rather than rejection.
