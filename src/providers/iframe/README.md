# IframeBridge

The IframeBridge provides communication between iframe and its host page. Both sides can define methods and interact with each other.

## Structure

- `IframeBridge.ts` - Main bridge provider implementation
- `types.ts` - Type definitions specific to IframeBridge
- `index.ts` - Export file for easy imports

## Usage

### In the iframe (child window)

```typescript
import {
    iframeBridgeProvider,
    IframeBridgeMethod,
} from '@/providers/iframe';

// Send a compose request to the parent
await iframeBridgeProvider.request(
    IframeBridgeMethod.COMPOSE,
    {
        text: 'Hello from iframe!',
        activity: 'post',
        mentions: [],
    },
);

// Send a toast notification to the parent
await iframeBridgeProvider.request(
    IframeBridgeMethod.ENQUEUE_MESSAGE,
    {
        message: 'Success!',
        type: 'success',
        duration: 3000,
    },
);

// Handle requests from parent
iframeBridgeProvider.onRequest(
    async (method, params, id) => {
        switch (method) {
            case IframeBridgeMethod.COMPOSE:
                // Handle compose request
                console.log('Compose request:', params);
                break;
            case IframeBridgeMethod.ENQUEUE_MESSAGE:
                // Handle toast request
                console.log('Toast request:', params);
                break;
        }
    },
);
```

### In the parent window (host page)

```typescript
import {
    iframeBridgeProvider,
    IframeBridgeMethod,
} from '@/providers/iframe';

// Send a compose request to the iframe
await iframeBridgeProvider.request(
    IframeBridgeMethod.COMPOSE,
    {
        text: 'Hello from parent!',
        activity: 'post',
        mentions: [],
    },
);

// Send a toast notification to the iframe
await iframeBridgeProvider.request(
    IframeBridgeMethod.ENQUEUE_MESSAGE,
    {
        message: 'Error occurred!',
        type: 'error',
        duration: 5000,
    },
);

// Handle requests from iframe
iframeBridgeProvider.onRequest(
    async (method, params, id) => {
        switch (method) {
            case IframeBridgeMethod.COMPOSE:
                // Handle compose request from iframe
                console.log(
                    'Compose request from iframe:',
                    params,
                );
                break;
            case IframeBridgeMethod.ENQUEUE_MESSAGE:
                // Handle toast request from iframe
                console.log(
                    'Toast request from iframe:',
                    params,
                );
                break;
        }
    },
);
```

## Supported Methods

- `IframeBridgeMethod.COMPOSE` - Send compose requests with text, activity, and mentions
- `IframeBridgeMethod.ENQUEUE_MESSAGE` - Show toast notifications with message, type, and duration

## Security

The bridge only accepts messages from the same origin for security. Make sure both the iframe and parent are served from the same domain in production.
