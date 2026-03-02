# `hexToRGBA`

Converts a six-digit hexadecimal colour string into a CSS `rgba()` colour string.

## Usage

```typescript
import { hexToRGBA } from '@dimensiondev/utils';

hexToRGBA('#ff6600'); // 'rgba(255, 102, 0, 1)'
hexToRGBA('#ff6600', 0.5); // 'rgba(255, 102, 0, 0.5)'
hexToRGBA('#000000', 0); // 'rgba(0, 0, 0, 0)'
```

Applying a semi-transparent overlay in a style object:

```tsx
const overlayStyle = {
    backgroundColor: hexToRGBA(theme.primaryColor, 0.15),
};
```

## Reference

```typescript
function hexToRGBA(hex: string, alpha?: number): string;
```

- `hex` — a six-digit hex colour string with a leading `#` (e.g. `'#rrggbb'`).
- `alpha` — opacity between `0` (transparent) and `1` (opaque). Defaults to `1`.
- Returns a CSS `rgba(r, g, b, a)` string.

## Notes

- Only six-digit hex codes (`#rrggbb`) are supported. Three-digit shorthand (`#rgb`) is **not** handled.
- No validation is performed on the input; passing an invalid hex string will produce `NaN` components.
