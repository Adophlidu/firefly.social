# `parseUrl`

Parses a URL string into a `URL` object, optionally prepending `https://` when the protocol is missing. Returns `null` if the string cannot be parsed.

## Usage

```typescript
import { parseUrl } from '@dimensiondev/utils';

parseUrl('https://example.com/path?q=1'); // URL { href: 'https://example.com/path?q=1' }
parseUrl('example.com'); // URL { href: 'https://example.com/' }  (auto-fixed)
parseUrl('not a url :::'); // null
```

Disable automatic protocol injection:

```typescript
parseUrl('example.com', { autoFixProtocol: false }); // null
```

Extracting URL components safely:

```typescript
const url = parseUrl(userInput);
if (url) {
    console.log(
        url.hostname,
        url.pathname,
        url.searchParams.get('id'),
    );
}
```

## Reference

```typescript
interface ParseUrlOptions {
    autoFixProtocol?: boolean;
}

function parseUrl(
    url: string,
    options?: ParseUrlOptions,
): URL | null;
```

- `url` — the string to parse.
- `options.autoFixProtocol` — when `true` (default), retries parsing with `https://` prepended if the initial parse fails.
- Returns a `URL` instance on success, or `null` when the string cannot form a valid URL.

## Notes

- Uses the native `URL.canParse()` API for validation, available in modern browsers and Node.js ≥ 18.3.
- The auto-fix only tries `https://`; custom protocols (e.g. `ftp://`) must be provided in the input string.
