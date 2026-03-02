# `asyncIteratorToArray`

Drains an async iterable into an array, automatically filtering out any `Error` instances encountered during iteration.

## Usage

```typescript
import { asyncIteratorToArray } from '@dimensiondev/utils';

async function* fetchPages(): AsyncIterable<Page | Error> {
    yield await fetchPage(1);
    yield new Error('page 2 failed');
    yield await fetchPage(3);
}

const pages = await asyncIteratorToArray(fetchPages());
// pages contains only successful Page values — errors are dropped
```

Handles `undefined` input gracefully:

```typescript
const items = await asyncIteratorToArray(undefined);
// items === []
```

## Reference

```typescript
async function asyncIteratorToArray<T>(
    iterable?: AsyncIterable<T>,
): Promise<Array<Exclude<T, Error>>>;
```

- `iterable` — an `AsyncIterable<T>` to consume, or `undefined`.
- Returns a `Promise` resolving to an array of all non-`Error` values yielded by the iterable.

## Notes

- If `iterable` is `undefined` or `null`, an empty array is returned immediately.
- Only direct `instanceof Error` values are filtered; non-error rejections during iteration will propagate as normal exceptions.
