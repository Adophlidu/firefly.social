# @dimensiondev/iframe-bridge

`IframeBridge` provides communication between an iframe and its host page.

It is a typed, promise-based RPC layer built on top of `window.postMessage`. A page
embedded as an iframe and the page that embeds it can call methods on each other —
compose, login, navigation, embedded-wallet RPC, toast notifications, etc. — without
having to hand-roll `postMessage` plumbing or message correlation.

## Installation

```bash
pnpm add @dimensiondev/iframe-bridge
```

This package is published to the GitHub Packages registry under the `@dimensiondev`
scope. Inside this monorepo it is consumed as a workspace dependency:

```jsonc
{
    "dependencies": {
        "@dimensiondev/iframe-bridge": "workspace:^",
    },
}
```

## How it works

The same `IframeBridgeProvider` runs on both sides of the boundary. It resolves the
"target window" automatically (see [`src/getTargetWindow.ts`](./src/getTargetWindow.ts)):

- If the current window **is an iframe**, the target is `window.parent`.
- If the current window **is the host**, the target is the first same-origin child
  iframe — or a specific one when `targetIframeId` is supplied.

Before sending, the bridge waits (up to 30s) for the target window's `load` event so
messages aren't dropped against a not-yet-ready frame.

Each `request` generates a unique id and posts an `iframe-bridge-request` message.
The receiver — registered via `onRequest` — runs its handler and replies with an
`iframe-bridge-response` message carrying the same id, which resolves the caller's
promise.

**Security:** incoming messages are accepted only when `event.origin` matches the
current page's origin (same-origin). Outgoing messages use `targetOrigin: '*'`.
Requests time out after **3 minutes**. A subset of "fire-and-forget" methods (see
`REQUEST_ONLY_METHODS` in `IframeBridge.ts`) resolve immediately unless
`awaitResponse` is set.

## Usage

### Sending requests

```ts
import {
    iframeBridgeProvider,
    IframeBridgeMethod,
} from '@dimensiondev/iframe-bridge';

if (iframeBridgeProvider.supported) {
    // Fire-and-forget action (resolves immediately).
    await iframeBridgeProvider.request(
        IframeBridgeMethod.NAVIGATE,
        {
            path: '/explore',
        },
    );

    // Request a response from an embedded wallet iframe by element id.
    const result = await iframeBridgeProvider.request(
        IframeBridgeMethod.FIREFLY_WALLET_EVM_RPC,
        { method: 'eth_chainId' },
        {
            targetIframeId: 'firefly-wallet-iframe',
            awaitResponse: true,
        },
    );
}
```

### Handling requests

```ts
import {
    iframeBridgeProvider,
    IframeBridgeMethod,
} from '@dimensiondev/iframe-bridge';

// Register a single handler for all incoming requests.
// Returns a cleanup function that removes the listener.
const dispose = iframeBridgeProvider.onRequest(
    async (method, params) => {
        switch (method) {
            case IframeBridgeMethod.COMPOSE:
                // params is typed as { text: string }
                return openComposer(params.text);
            default:
                return;
        }
    },
);

// later…
dispose();
iframeBridgeProvider.destroy();
```

Use the exported `iframeBridgeProvider` singleton in app code. The
`IframeBridgeProvider` class is also exported for isolated instances (e.g. tests).

## API

### `iframeBridgeProvider`

A ready-to-use `IframeBridgeProvider` singleton.

### `class IframeBridgeProvider`

| Member      | Signature                                                                                                                                                                 | Description                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supported` | `get supported(): boolean`                                                                                                                                                | `true` when a `window` object is available.                                                                                                                                           |
| `request`   | `request<T extends IframeBridgeMethod>(method: T, params: IframeBridgeRequestArguments[T], options?: IframeBridgeRequestOptions): Promise<IframeBridgeResponseResult[T]>` | Sends a request to the target window. Resolves with the typed result, or immediately for request-only methods (unless `awaitResponse`). Rejects on error or after a 3‑minute timeout. |
| `onRequest` | `onRequest(handler): () => void`                                                                                                                                          | Registers a handler for incoming requests. Returns a function that removes the listener.                                                                                              |
| `destroy`   | `destroy(): void`                                                                                                                                                         | Removes the response listener and clears pending callbacks.                                                                                                                           |

### `IframeBridgeRequestOptions`

| Option           | Type      | Description                                                                           |
| ---------------- | --------- | ------------------------------------------------------------------------------------- |
| `awaitResponse`  | `boolean` | Force a request-only method to wait for a response.                                   |
| `targetIframeId` | `string`  | When the host targets a specific child iframe (e.g. the wallet), pass its element id. |

### Methods (`IframeBridgeMethod`)

The full catalogue with per-method params and results lives in
[`src/types.ts`](./src/types.ts). Grouped by surface:

- **firefly.social** — `COMPOSE`, `LOGIN`, `NAVIGATE`, `ENQUEUE_MESSAGE`, `DOWNLOAD_APP`
- **wallet iframe** — `FIREFLY_WALLET_OPEN`, `FIREFLY_WALLET_CLOSE`, `FIREFLY_WALLET_NAVIGATE`, `FIREFLY_WALLET_VISIBILITY`, `FIREFLY_WALLET_EVM_RPC`, `FIREFLY_WALLET_SOLANA_RPC`, `FIREFLY_WALLET_AUTHORIZED`, `FIREFLY_WALLET_SIGN_MESSAGE`, `FIREFLY_WALLET_ADD_SESSION_SIGNER`, `FIREFLY_WALLET_NOTIFY`, `FIREFLY_WALLET_REFRESH`, `FIREFLY_WALLET_SKIP_WALLET_AUTH`
- **masko iframe** — `MASKO_PLAY_ANIMATION`, `MASKO_SHOW_TEXT`
- **mystery-box iframe** — `ENABLE_SYNC_SESSION`

Each method's request params and response type are fully typed via
`IframeBridgeRequestArguments` and `IframeBridgeResponseResult`.

### Solana helpers

`SolanaMethod`, `SolanaRequestArgument`, `SolanaRequestArguments`, and
`SolanaResponse` describe the payloads used by `FIREFLY_WALLET_SOLANA_RPC`
(`SignMessage`, `SignTransaction`, `SignAndSendTransaction`, `SignAllTransactions`).

## Development

```bash
pnpm build        # bundle with tsdown (ESM + CJS + d.ts)
pnpm dev          # build in watch mode
pnpm typecheck    # tsgo --noEmit
pnpm clean        # remove dist/
```

## License

MIT
