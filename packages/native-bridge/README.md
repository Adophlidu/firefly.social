# @dimensiondev/native-bridge

Native bridge for Firefly webview integration (Android / iOS).

It provides a typed, promise-based RPC channel between a web page running inside the
Firefly mobile app's WebView and the surrounding native host. Web code calls native
methods (login, wallet, transactions, navigation, sharing, etc.) and subscribes to
native events (account / chain changes), without having to deal with the underlying
Android `FireflyApi` interface or the iOS `webkit.messageHandlers` API directly.

## Installation

```bash
pnpm add @dimensiondev/native-bridge
```

This package is published to the GitHub Packages registry under the `@dimensiondev`
scope. Inside this monorepo it is consumed as a workspace dependency:

```jsonc
{
    "dependencies": {
        "@dimensiondev/native-bridge": "workspace:^",
    },
}
```

## How it works

The bridge talks to two host implementations, picked automatically at runtime:

- **Android** — calls `window.FireflyApi.callNativeMethod(method, id, params)`.
- **iOS** — posts to `window.webkit.messageHandlers.callNativeMethod`.

For every request the provider generates a unique id, registers a callback, and
dispatches the call. The native side answers by invoking `window.callJsMethod(method, id, payload)`,
which the provider installs on `window` in its constructor. Matching ids resolve the
pending promise; unmatched ids are dispatched to event listeners instead.

Requests time out after **3 minutes**. A subset of "fire-and-forget" methods (see
`REQUEST_ONLY_METHODS` in `NativeBridge.ts`) resolve immediately without waiting for a
native response.

## Usage

```ts
import {
    nativeBridgeProvider,
    SupportedMethod,
    SupportedEvent,
    Network,
} from '@dimensiondev/native-bridge';

// 1. Feature-detect the native host before using the bridge.
if (nativeBridgeProvider.supported) {
    // 2. Request data / actions from the native app (awaits a response).
    const theme = await nativeBridgeProvider.request(
        SupportedMethod.GET_THEME,
        {},
    );
    const addresses = await nativeBridgeProvider.request(
        SupportedMethod.GET_WALLET_ADDRESS,
        {
            type: Network.EVM,
        },
    );

    // 3. Fire-and-forget actions resolve immediately.
    await nativeBridgeProvider.request(
        SupportedMethod.OPEN_URL,
        { url: 'https://firefly.social' },
    );

    // 4. Subscribe to native events; the returned function unsubscribes.
    const unsubscribe = nativeBridgeProvider.on(
        SupportedEvent.CHANGE_ACCOUNT,
        ({ type, address }) => {
            console.log('account changed', type, address);
        },
    );

    unsubscribe();
}
```

Use the exported `nativeBridgeProvider` singleton in app code. The
`NativeBridgeProvider` class is exported as well for cases that need an isolated
instance (e.g. tests).

## API

### `nativeBridgeProvider`

A ready-to-use `NativeBridgeProvider` singleton.

### `class NativeBridgeProvider`

| Member      | Signature                                                                                                | Description                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supported` | `get supported(): boolean`                                                                               | `true` when running inside a native WebView (Android or iOS host detected).                                                                            |
| `request`   | `request<T extends SupportedMethod>(method: T, params: RequestArguments[T]): Promise<ResponseResult[T]>` | Invokes a native method. Resolves with the typed result, or immediately for request-only methods. Rejects on native error or after a 3‑minute timeout. |
| `on`        | `on<T extends SupportedEvent>(event: T, listener: (payload: EventPayload[T]) => void): () => void`       | Subscribes to a native event. Returns an unsubscribe function.                                                                                         |

### Methods (`SupportedMethod`)

The full method catalogue lives in [`src/types.ts`](./src/types.ts). Highlights:

- **Session / identity** — `GET_AUTHORIZATION`, `GET_REFRESH_TOKEN`, `LOGIN`, `LOGIN_OR_BIND_EMAIL`
- **App context** — `GET_SUPPORTED_METHODS`, `GET_THEME`, `GET_LANGUAGE`, `GET_FRAME_CONTEXT`, `SET_FRAME_READY_OPTIONS`
- **Wallet** — `GET_WALLET_ADDRESS`, `CONNECT_WALLET`, `BIND_WALLET`, `GET_CHAIN_ID`
- **EVM / Solana** — `SIGN_MESSAGE`, `SIGN_TYPED_DATA`, `SIGN_TRANSACTION`, `SEND_TRANSACTION`, `SEND_EVM_TRANSACTION`, `SEND_SOLANA_TRANSACTION`, `ADD_ETHEREUM_CHAIN`, `SWITCH_ETHEREUM_CHAIN`
- **Social** — `IS_TWITTER_USER_FOLLOWING`, `FOLLOW_TWITTER_USER`, `FOLLOW_LENS_USER`, `FOLLOW_FARCASTER_USER`
- **UI / navigation** — `UPDATE_NAVIGATOR_BAR`, `SET_PRIMARY_BUTTON`, `OPEN_URL`, `SHARE`, `COMPOSE`, `ADD_CALENDAR`, `BACK`, `CLOSE`
- **Privy** — `FUND_PRIVY_ACCOUNT`

Each method's request params and response type are fully typed via `RequestArguments`
and `ResponseResult`.

### Events (`SupportedEvent`)

| Event                     | Payload                              |
| ------------------------- | ------------------------------------ |
| `CHANGE_ACCOUNT`          | `{ type: Network; address: string }` |
| `CHANGE_CHAIN_ID`         | `{ type: Network; chainId: string }` |
| `WEBVIEW_DID_FINISH_LOAD` | `{}`                                 |

### Enums

- `Theme` — `Auto` \| `Light` \| `Dark`
- `Network` — `All` \| `EVM` \| `Solana`

## Development

```bash
pnpm build        # bundle with tsdown (ESM + CJS + d.ts)
pnpm dev          # build in watch mode
pnpm typecheck    # tsgo --noEmit
pnpm clean        # remove dist/
```

## License

MIT
