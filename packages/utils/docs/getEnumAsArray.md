# `getEnumAsArray`

Converts a TypeScript enum (or any plain enum-like object) into an array of `{ key, value }` pairs, filtering out the reverse-mapping entries that TypeScript adds for numeric enums.

## Usage

```typescript
import { getEnumAsArray } from '@dimensiondev/utils';

enum Status {
    Active = 'active',
    Inactive = 'inactive',
    Pending = 'pending',
}

getEnumAsArray(Status);
// [
//   { key: 'Active',   value: 'active'   },
//   { key: 'Inactive', value: 'inactive' },
//   { key: 'Pending',  value: 'pending'  },
// ]
```

Numeric enum (reverse-mapping entries are excluded):

```typescript
enum Direction {
    Up,
    Down,
    Left,
    Right,
}

getEnumAsArray(Direction);
// [
//   { key: 'Up',    value: 0 },
//   { key: 'Down',  value: 1 },
//   { key: 'Left',  value: 2 },
//   { key: 'Right', value: 3 },
// ]
```

Building a `<select>` from an enum:

```tsx
{
    getEnumAsArray(Status).map(({ key, value }) => (
        <option key={value} value={value}>
            {key}
        </option>
    ));
}
```

## Reference

```typescript
function getEnumAsArray<T extends object>(
    enumObject: T,
): Array<{ key: string; value: T[keyof T] }>;
```

- `enumObject` — any TypeScript enum or plain key-value object.
- Returns an array of objects where `key` is the enum member name and `value` is the corresponding enum value.

## Notes

- Only string-keyed entries are included; numeric reverse-mapping keys (e.g. `"0"`, `"1"`) are filtered out.
- Works with `const` enums only if they are not inlined by the TypeScript compiler (i.e. `declare const enum` will not work at runtime).
