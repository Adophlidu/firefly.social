# `assert`

Runtime assertion that throws an `Error` when the condition is falsy. Narrows the type of the condition for TypeScript's control-flow analysis.

## Usage

```typescript
import { assert } from '@dimensiondev/utils';

function getUser(id: string | undefined) {
    assert(id !== undefined, 'User ID is required');
    // TypeScript now knows `id` is `string`
    return fetchUser(id);
}
```

Guarding object shapes:

```typescript
const result = await fetchProfile();
assert(result !== null, 'Profile not found');
// `result` is narrowed — no longer `null`
console.log(result.name);
```

## Reference

```typescript
function assert(
    condition: any,
    message: string,
): asserts condition;
```

- `condition` — the value to test. If falsy (`false`, `null`, `undefined`, `0`, `''`, etc.) an error is thrown.
- `message` — the error message passed to the thrown `Error`.
- Returns `void`. The `asserts condition` return type tells TypeScript the condition is truthy after the call.

## Notes

- Throws a plain `Error`; catch it with a standard `try/catch` or let it propagate.
- Use [`unreachable`](./unreachable.md) for exhaustiveness checks on discriminated unions.
