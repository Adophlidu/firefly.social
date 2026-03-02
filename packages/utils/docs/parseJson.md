# `parseJson`

Safely parses a JSON string and returns the parsed value, or `undefined` if the input is empty or malformed.

## Usage

```typescript
import { parseJson } from '@dimensiondev/utils';

parseJson<{ name: string }>('{"name":"Alice"}'); // { name: 'Alice' }
parseJson('not valid json'); // undefined
parseJson(null); // undefined
parseJson(undefined); // undefined
```

Reading from localStorage without throwing:

```typescript
const settings = parseJson<Settings>(
    localStorage.getItem('settings'),
);
// settings is Settings | undefined
```

## Reference

```typescript
function parseJson<T>(
    json: string | undefined | null,
): T | undefined;
```

- `json` — a JSON string, or `null`/`undefined`.
- Returns the parsed value typed as `T`, or `undefined` if parsing fails or the input is falsy.

## Notes

- The type parameter `T` is a type assertion — no runtime validation is performed. Use a schema validator (e.g. Zod) if you need to verify the shape of the parsed data.
- An empty string is treated as falsy and returns `undefined`.
