# @dimensiondev/exception-tracker

Exception tracking for Firefly projects. Replaces Sentry with a lightweight sendBeacon-based client and server-side reporting.

## Installation

```bash
pnpm add @dimensiondev/exception-tracker
```

## Usage

### 1. Configure (required)

Call `configureExceptionTracker()` once at app startup with your app-specific config:

```ts
import { configureExceptionTracker } from '@dimensiondev/exception-tracker';

configureExceptionTracker({
    getClient: () => ({
        version: '1.0.0',
        commitHash: 'abc123',
        environment: 'production',
        vercelEnvironment: 'production',
        beaconUrl: '/api/beacon/exceptions',
        serviceName: 'firefly-web',
        getBom: () => ({
            navigator:
                typeof navigator !== 'undefined'
                    ? navigator
                    : null,
            location:
                typeof location !== 'undefined'
                    ? location
                    : null,
            window:
                typeof window !== 'undefined'
                    ? window
                    : null,
        }),
        getUrls: () => ({
            rootUrl: 'https://api.example.com',
            siteUrl: 'https://example.com',
            frameServerUrl: 'https://frames.example.com',
        }),
    }),
    getServer: () => ({
        baseUrl:
            'https://firefly-exception-tracker.example.com',
        version: '1.0.0',
        commitHash: 'abc123',
        environment: 'production',
        serviceName: 'firefly-server',
    }),
    getUserContext: () => ({
        user_id: '...',
        twitter_username: '...',
        lens_handle: '...',
        farcaster_id: '...',
        bsky_id: '...',
    }),
});
```

### 2. Use the APIs

```ts
import {
    captureException,
    ExceptionId,
    reportExceptionServer,
} from '@dimensiondev/exception-tracker';
import {
    useInitGlobalErrorHandlers,
    useReportErrorOnce,
} from '@dimensiondev/exception-tracker/client';

// Client: capture an exception
captureException(ExceptionId.RUNTIME_ERROR, error, {
    handler: 'my-handler',
});

// Client: init global error handlers (window.onerror, unhandledrejection, etc.)
useInitGlobalErrorHandlers();

// Client: report error once in error boundary
useReportErrorOnce(error, {
    exceptionId: ExceptionId.UI_CRASH,
});

// Server: report API route errors
await reportExceptionServer(error, {
    request_url: request.url,
});
```

## Exports

**Main package** (`@dimensiondev/exception-tracker`):

- `captureException` - Report client-side exceptions via sendBeacon
- `ExceptionId` - Enum of exception types
- `classifyError` - Classify errors (chunk load, network, etc.)
- `configureExceptionTracker` - Configure the tracker (required before use)
- `getErrorMessage` - Extract message from unknown value
- `initGlobalErrorHandlers` - Init global handlers (non-hook version)
- `normalizeError` - Normalize unknown to Error
- `reportException` - Low-level client report
- `reportExceptionServer` - Server-side report

**Client package** (`@dimensiondev/exception-tracker/client`) – for `'use client'` components:

- `useInitGlobalErrorHandlers` - Hook to init global handlers
- `useReportErrorOnce` - Hook for error boundaries
