# Timestamp Utilities

Helpers for detecting the format of a numeric timestamp string.

## `isMilliseconds`

Returns `true` if the string represents a millisecond-precision Unix timestamp (13 digits, all numeric).

### Usage

```typescript
import { isMilliseconds } from '@dimensiondev/utils';

isMilliseconds('1710000000000'); // true  — 13-digit ms timestamp
isMilliseconds('1710000000'); // false — 10-digit (Unix seconds)
isMilliseconds('abc1234567890'); // false — non-numeric
```

### Reference

```typescript
function isMilliseconds(ts: string): boolean;
```

- `ts` — the string to test.
- Returns `true` if `ts` is exactly 13 characters long and contains only digits.

---

## `isUnix`

Returns `true` if the string represents a second-precision Unix timestamp (10 digits, all numeric).

### Usage

```typescript
import { isUnix } from '@dimensiondev/utils';

isUnix('1710000000'); // true  — 10-digit Unix timestamp
isUnix('1710000000000'); // false — 13-digit (milliseconds)
isUnix('not-a-number'); // false
```

### Reference

```typescript
function isUnix(ts: string): boolean;
```

- `ts` — the string to test.
- Returns `true` if `ts` is exactly 10 characters long and contains only digits.

---

## Notes

- Both functions validate **format only** (length and digit content). They do not check whether the numeric value represents a plausible date.
- Use these helpers when normalising timestamps from mixed API sources that may return either seconds or milliseconds.

```typescript
import {
    isMilliseconds,
    isUnix,
} from '@dimensiondev/utils';

function toDate(ts: string): Date {
    if (isMilliseconds(ts)) return new Date(Number(ts));
    if (isUnix(ts)) return new Date(Number(ts) * 1000);
    throw new Error(`Unknown timestamp format: ${ts}`);
}
```
