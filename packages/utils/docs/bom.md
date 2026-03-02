# `bom`

Safe accessor object for browser globals (`window`, `document`, `location`, `navigator`, `localStorage`). Returns `null` in non-browser environments such as server-side rendering (SSR).

## Usage

```typescript
import { bom } from '@dimensiondev/utils';

// Safe access — no `typeof window !== 'undefined'` boilerplate
const href = bom.location?.href;
const ua = bom.navigator?.userAgent;

// localStorage without guard
bom.localStorage?.setItem('key', 'value');
const value = bom.localStorage?.getItem('key');
```

WebKit native bridge detection:

```typescript
const nativeBridge =
    bom.window?.webkit?.messageHandlers?.callNativeMethod;
if (nativeBridge) {
    nativeBridge.postMessage({
        method: 'openCamera',
        tag: '1',
        params: '{}',
    });
}
```

## Reference

```typescript
const bom: {
    readonly window: CustomWindow | null;
    readonly document: Document | null;
    readonly location: Location | null;
    readonly navigator: Navigator | null;
    readonly localStorage: Storage | null;
};
```

Each property is a getter that evaluates at access time, so it always reflects the current environment.

### `CustomWindow` extensions

| Property                  | Type                  | Description                       |
| ------------------------- | --------------------- | --------------------------------- |
| `opera`                   | `string`              | Opera browser identifier          |
| `MSStream`                | `object`              | IE/Edge stream object             |
| `webkit?.messageHandlers` | `object \| undefined` | iOS WebKit native bridge handlers |
| `FireflyApi`              | `object \| undefined` | Firefly native method bridge      |

## Notes

- All properties return `null` (not `undefined`) when the global is unavailable, so optional chaining (`?.`) works uniformly.
- Getters are lazy — evaluated on every access, not at import time, which is important for environments that set up globals after module initialisation.
