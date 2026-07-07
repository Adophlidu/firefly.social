/**
 * The DOM id of the FireflyWallet iframe. Lives in constants (not in
 * `components/FireflyWallet.tsx`) so modules that only need the id (iframe
 * bridge, snaps, frame swaps, connectors) do not pull the FireflyWallet
 * component — and its AppKit-controllers dependency — into their chunk.
 */
export const FIREFLY_WALLET_IFRAME_ID = `firefly-wallet-iframe`;
