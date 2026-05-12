# Security & Supply-Chain Review

## 1. Secrets / PII Leakage

Firefly handles wallet sessions, multi-network social tokens, and signing flows — leakage can compromise user accounts or funds. Check ALL exfiltration paths:

**Exfil sinks to inspect:**

- `console.*`, logging utilities, analytics SDKs, error reporting (e.g. `@dimensiondev/exception-tracker`)
- Network requests (`fetch`, `axios`, WebSocket)
- Browser storage (both apps): `localStorage` / `sessionStorage` / `IndexedDB` / cookies — apps/wallet is a Vite SSR web app and uses the same browser storage as apps/web (no `AsyncStorage`, no native secure storage)
- Persisted Zustand stores in `apps/web/src/store/` and `apps/wallet/src/store/`
- jotai atoms with persistence (`atomWithStorage`) inside the perps subtree (via `@dimensiondev/rn-ui`)

**What must NEVER leak:**

- Mnemonics / seed phrases / private keys / signing payloads
- Firefly session tokens / OAuth refresh tokens / cookies / session IDs
- Hyperliquid auth tokens / API keys / per-network tokens (Lens, Farcaster, Bluesky)
- Addresses tied to identity / any PII

**When you find a potential leak, document:**

- **Source**: what sensitive data
- **Sink**: where it goes (log? network? storage?)
- **Trigger**: when it happens
- **Impact**: who/what is exposed
- **Fix**: concrete remediation

```bash
# Grep for potential leaks in changed files
git diff origin/main...HEAD --name-only | xargs grep -n -E \
  "mnemonic|seed|private.?key|secret|password|token|apiKey|cookie|session" 2>/dev/null
```

## 2. AuthN / AuthZ

- Verify authentication guards wrap every protected route — no bypass paths.
- Verify authorization checks (roles/permissions) are correct and consistent.
- Server/client trust boundary: never trust client input for authorization decisions.
- Check for authentication state that persists incorrectly across account switches — multi-account is core to Firefly, and stale session data across switches is a common bug class.
- Validate that session refreshes (e.g. `apps/wallet/src/store/fireflySession.ts`) clear stale tokens before storing new ones.

## 3. Supply-Chain Security

When `package.json` or `pnpm-lock.yaml` changed, you MUST do ALL of these:

### 3.1 Enumerate Changes

List every added/updated/removed dependency with **name + from→to version**.

### 3.2 Ecosystem Risk Check

For each changed package, check:

- Recent maintainer/ownership changes
- Suspicious release cadence
- Known advisories / CVEs
- Typosquatting risk (similar package names)

```bash
npm view <pkg> time maintainers repository dist.tarball
```

### 3.3 Source Inspection (node_modules)

Inspect `node_modules/<pkg>/package.json` and entrypoints. Grep for:

| Category              | Patterns                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Outbound network**  | `fetch(`, `axios`, `XMLHttpRequest`, `http.request`, `https.request`, `WebSocket`, `net.`, `dns.` |
| **Dynamic execution** | `eval(`, `new Function`, `vm.runIn`, `child_process`, `spawn(`, `exec(`                           |
| **Install hooks**     | `postinstall`, `preinstall`, `node-pre-gyp`, `prebuild`, `download`, `curl`, `wget`               |
| **Privilege access**  | filesystem, clipboard, environment variables                                                      |

**HIGH RISK — block unless justified:**

- Any telemetry / remote config fetch / unexpected outbound requests.
- Any dynamic execution or install-time script behavior.
- Any access to sensitive storage or wallet/session-related data.

pnpm-specific: pnpm runs install hooks by default. Use `pnpm install --ignore-scripts` locally if you need to inspect a package before its postinstall runs.

### 3.4 React Native-Style Dependencies in a Web Context

Firefly today is web-only — apps/web ships via Next.js, apps/wallet ships via Vite SSR using `react-native-web` to render RN-shaped components in the browser. There is no native iOS/Android build right now.

This still matters for dep review because RN packages can ship behaviors that are surprising in a web context:

- Packages with `.podspec`, `ios/`, `android/`, `react-native.config.js`, or TurboModule manifests: even if those layers don't run, postinstall scripts and the JS half might still execute. Inspect the JS entrypoint and any `postinstall` hook.
- Packages that assume a native bridge (e.g., direct `NativeModules.X` calls) — they'll likely throw on web; flag as "won't work" rather than a security risk per se.
- If a native build is ever added (Expo, Metro, or bare RN), revisit this section: at that point CocoaPods/Gradle transitive deps and obfuscated native code must be reviewed as HIGH RISK.

## 4. Outbound Request Callout

If `node_modules` code performs ANY outbound request, document:

- **Call site**: exact file path + function
- **Destination**: full URL/host
- **Payload**: what data is sent
- **Headers/auth**: tokens/cookies/identifiers attached
- **Trigger**: when/how it runs
- **Surface impact**: which apps are affected (`apps/web`, `apps/wallet`)

## 5. Bulk Operations Security

### File upload without size limits

```typescript
// Bad: could be gigabytes
const content = await file.text();

// Good: check size first
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_SIZE) throw new Error('File too large');
```

### User input in batch operations

Validate each value — don't trust `.split(',').map(Number)` blindly. Particularly important for:

- Multi-recipient transfers
- Bulk follow/unfollow operations
- Multi-asset trades

### Address / contract address handling

```typescript
// Risk: wrong address = lost funds. Verify checksum.
import { getAddress } from 'viem';
const CONTRACT = getAddress('0x123...'); // Throws if invalid
```

## 6. Cross-Network Trust

Firefly aggregates multiple social networks (Farcaster, Bluesky, Lens) and chains (EVM, Solana). Common pitfalls:

- **Identity confusion**: never display one network's user data under another network's branding.
- **Cross-network linking**: if a user links accounts across networks, verify the link is authenticated (signed challenge) rather than user-claimed.
- **Per-network rate limits and quotas**: rate-limit failures on one network must not cascade or block others.
- **Per-network error mapping**: don't surface raw API errors from one network in the UI of another.
