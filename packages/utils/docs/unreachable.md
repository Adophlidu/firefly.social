# `unreachable` / `safeUnreachable`

Utility functions for marking code paths that should never be reached, providing both compile-time exhaustiveness checking and runtime safety nets.

## `unreachable`

Asserts at compile time that `value` is `never` (all cases handled), and throws at runtime if somehow reached.

### Usage

```typescript
import { unreachable } from '@dimensiondev/utils';

type Shape = 'circle' | 'square' | 'triangle';

function area(shape: Shape, size: number): number {
    switch (shape) {
        case 'circle':
            return Math.PI * size ** 2;
        case 'square':
            return size ** 2;
        case 'triangle':
            return (Math.sqrt(3) / 4) * size ** 2;
        default:
            return unreachable(shape);
        // TypeScript error if a case is missing ↑
    }
}
```

Discriminated unions:

```typescript
function handleEvent(event: AppEvent) {
    if (event.type === 'LOGIN') {
        // ...
    } else if (event.type === 'LOGOUT') {
        // ...
    } else {
        unreachable(event); // compile error if new event types are added without handling
    }
}
```

### Reference

```typescript
function unreachable(value: never): never;
```

- `value` — must be typed `never` at the call site. TypeScript will emit a compile error if any variant is unhandled.
- Logs the unexpected value and throws an `Error` at runtime.

---

## `safeUnreachable`

Like `unreachable`, but logs instead of throwing. Use when you want exhaustiveness checking without crashing on unhandled cases in production.

### Usage

```typescript
import { safeUnreachable } from '@dimensiondev/utils';

function logEvent(event: AppEvent) {
    switch (event.type) {
        case 'LOGIN':
            console.log('User logged in');
            break;
        case 'LOGOUT':
            console.log('User logged out');
            break;
        default:
            safeUnreachable(event); // logs unknown events
    }
}
```

### Reference

```typescript
function safeUnreachable(value: never): void;
```

- `value` — must be typed `never` at the call site.
- Logs the unexpected value via `console.error` and returns without throwing.

---

## Notes

- Both functions require the parameter to be typed as `never`. If TypeScript reports an error at the call site, it means you have unhandled cases.
- `unreachable` is suitable for logic that must never be reached in a correctly functioning program.
- `safeUnreachable` is suitable for defensive logging in areas where unexpected enum values could appear from external data.
- See also [`UnreachableError`](./error.md#unreachableerror) if you prefer throwing a typed error class directly.
