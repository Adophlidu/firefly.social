/**
 * Pathnames that should bypass `LoginRequired` and `PrivyReadyRequired` gates
 * in __root. These routes render unauthenticated content (e.g. iframe-embedded
 * widgets) and don't need a Firefly session or a booted Privy SDK.
 *
 * Exact pathname match. Add prefix support here if you need it later.
 */
export const PUBLIC_ROUTES: ReadonlySet<string> = new Set(['/perp-kline-chart']);
