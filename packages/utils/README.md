# @firefly/utils

A collection of shared utility functions for Firefly projects. Provides browser-safe utilities, promise helpers, and common patterns used across the ecosystem.

## Features

- 🌐 **Browser-safe**: All utilities work in both browser and server environments
- 🎯 **Type-safe**: Full TypeScript support with strict typing
- 📦 **Tree-shakable**: Import only what you need
- 🔄 **Promise utilities**: Advanced promise manipulation helpers
- 🛡️ **SSR-safe**: Safe to use in server-side rendering environments

## Installation

```bash
# Using pnpm (recommended for workspace)
pnpm add @firefly/utils

# Using npm
npm install @firefly/utils

# Using yarn
yarn add @firefly/utils
```

## API Reference

### Browser Object Model (BOM)

Safe access to browser APIs that return `null` in non-browser environments.

```typescript
import { bom } from '@firefly/utils';

// Safe access to browser APIs
if (bom.window) {
    console.log('Running in browser');
}

if (bom.document) {
    const element =
        bom.document.getElementById('my-element');
}

if (bom.localStorage) {
    bom.localStorage.setItem('key', 'value');
}
```

**Available properties:**

- `bom.window` - Window object or null
- `bom.document` - Document object or null
- `bom.location` - Location object or null
- `bom.navigator` - Navigator object or null
- `bom.localStorage` - LocalStorage object or null

### Promise Utilities

#### `defer<T>()`

Creates a deferred promise that can be resolved or rejected externally.

```typescript
import { defer } from '@firefly/utils';

const [promise, resolve, reject] = defer<string>();

// Later in your code...
setTimeout(() => {
    resolve('Hello World!');
}, 1000);

const result = await promise; // 'Hello World!'
```

**Returns:** `[Promise<T>, resolve, reject]`

#### `timeout<T>(promise, time, rejectReason?)`

Adds a timeout to any promise, preventing it from hanging indefinitely.

```typescript
import { timeout } from '@firefly/utils';

try {
    // Timeout after 5 seconds
    const data = await timeout(
        fetch('/api/slow-endpoint'),
        5000,
        'API request timeout',
    );
} catch (error) {
    console.error(error.message); // 'API request timeout'
}
```

**Parameters:**

- `promise` - The promise to add timeout to
- `time` - Timeout in milliseconds
- `rejectReason` - Optional custom error message (defaults to "timeout")

**Returns:** `Promise<T>` that either resolves with the original promise or rejects with timeout error

## Usage Examples

### Safe DOM Manipulation

```typescript
import { bom } from '@firefly/utils';

function updateTitle(newTitle: string) {
    if (bom.document) {
        bom.document.title = newTitle;
    }
}

function getCurrentUrl(): string | null {
    return bom.location?.href || null;
}
```

### Promise Coordination

```typescript
import { defer, timeout } from '@firefly/utils';

// Create a promise that can be resolved later
const [dataReady, signalDataReady] = defer<Data>();

// Add timeout protection
const dataWithTimeout = timeout(
    dataReady,
    10000,
    'Data loading timeout',
);

// Somewhere else in your code
fetchData().then((data) => {
    signalDataReady(data);
});
```

### Event-Driven Patterns

```typescript
import { defer, bom } from '@firefly/utils';

function waitForWindowLoad(): Promise<Window> {
    if (!bom.window) {
        throw new Error('Not in browser environment');
    }

    if (bom.document?.readyState === 'complete') {
        return Promise.resolve(bom.window);
    }

    const [promise, resolve] = defer<Window>();

    const handleLoad = () => {
        resolve(bom.window!);
    };

    bom.window.addEventListener('load', handleLoad, {
        once: true,
    });

    return promise;
}
```

## TypeScript Support

All utilities come with full TypeScript support and type definitions.

```typescript
import {
    defer,
    timeout,
    bom,
    type DeferTuple,
} from '@firefly/utils';

// Type-safe deferred promise
const [promise, resolve, reject]: DeferTuple<User> =
    defer<User>();

// Type-safe timeout with proper error handling
const user: User = await timeout(fetchUser(), 5000);

// Type-safe BOM access
if (bom.window) {
    // TypeScript knows this is Window | null
    bom.window.location.href = '/redirect';
}
```

## License

MIT
