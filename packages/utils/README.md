# @dimensiondev/utils

Shared utility functions for Firefly projects.

```bash
npm install @dimensiondev/utils
# or
pnpm add @dimensiondev/utils
```

---

## Utilities

### Async & Control Flow

- [`anySignal`](./docs/anySignal.md) &mdash; combines multiple `AbortSignal`s into one that aborts when any of them abort.
- [`attemptUntil`](./docs/attemptUntil.md) &mdash; tries async functions sequentially until one succeeds, with fallback.
- [`createBatcher`](./docs/createBatcher.md) &mdash; batches individual requests into grouped fetches with deduplication.
- [`defer`](./docs/defer.md) &mdash; creates a promise with external `resolve` and `reject` handles.
- [`delay`](./docs/delay.md) &mdash; returns a promise that resolves after a given number of milliseconds.
- [`once`](./docs/once.md) &mdash; prevents concurrent execution of an async function, throwing if called while running.
- [`retry`](./docs/retry.md) &mdash; retries an async operation with configurable attempts and interval.
- [`squashCallback`](./docs/squashCallback.md) &mdash; deduplicates concurrent async calls, sharing one in-flight promise per key.
- [`timeout`](./docs/timeout.md) &mdash; rejects a promise if it does not settle within a given time limit.

### Error Handling

- [Error Classes](./docs/error.md) &mdash; typed error classes: `AbortError`, `AuthenticationError`, `ForbiddenError`, `InvalidResultError`, `NetworkError`, `NotAllowedError`, `NotFoundError`, `NotImplementedError`, `SeverityError`, `TimeoutError`, `UnauthorizedError`, `UnreachableError`, `UserRejectionError`.

### Type Safety & Assertions

- [`assert`](./docs/assert.md) &mdash; runtime assertion with TypeScript type narrowing via `asserts condition`.
- [`unreachable`](./docs/unreachable.md) &mdash; exhaustiveness checker that throws at runtime; `safeUnreachable` logs instead.
- [`createPredicate`](./docs/attemptUntil.md#createpredicate) &mdash; creates a type-guard function from a list of candidate values.

### Data & Collections

- [`asyncIteratorToArray`](./docs/asyncIteratorToArray.md) &mdash; drains an async iterable into an array, filtering out `Error` values.
- [`compose`](./docs/compose.md) &mdash; right-to-left function composition.
- [`createLookupTableResolver`](./docs/createLookupTableResolver.md) &mdash; creates a key-to-value resolver with fallback support.
- [`getEnumAsArray`](./docs/getEnumAsArray.md) &mdash; converts a TypeScript enum to an array of `{ key, value }` pairs.

### Utilities

- [`bom`](./docs/bom.md) &mdash; SSR-safe accessors for browser globals (`window`, `document`, `location`, `navigator`, `localStorage`).
- [`classNames`](./docs/classNames.md) &mdash; joins CSS class names conditionally.
- [`hexToRGBA`](./docs/hexToRGBA.md) &mdash; converts a hex colour string to `rgba()`.
- [`parseJson`](./docs/parseJson.md) &mdash; safely parses a JSON string, returning `undefined` on failure.
- [`parseUrl`](./docs/parseUrl.md) &mdash; parses a URL string with optional automatic protocol injection.
- [`isMilliseconds` / `isUnix`](./docs/ts.md) &mdash; detects the format of a numeric timestamp string.

---

## License

MIT
