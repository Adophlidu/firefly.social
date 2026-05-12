# @isaacs/brace-expansion 5.0.0 → 5.0.1 Upgrade Analysis

> PR: https://github.com/DimensionDev/firefly.mask.social/pull/0000
> Generated: 2026-05-12

---

## 1. Code Diff

### 1.1 New Exports

```javascript
// New constant
export const EXPANSION_MAX = 100_000;

// New type
export type BraceExpansionOptions = {
  max?: number; // default 100_000
};
```

### 1.2 Function Signature Changes

```diff
- export function expand(str: string): string[];
+ export declare const EXPANSION_MAX = 100000;
+ export type BraceExpansionOptions = {
+     max?: number;
+ };
+ export function expand(str: string, options?: BraceExpansionOptions): string[];
```

Added an optional `options` parameter with default `{}`, where `max` defaults to `100_000`.

### 1.3 Core Behavior Changes

Internal recursive `expand_()` signature changed from `(str, isTop)` to `(str, max, isTop)`. All recursive call sites now pass `max`.

**Cap 1** — comma-separated expansion post loop:

```diff
- for (let k = 0; k < post.length; k++) {
+ for (let k = 0; k < post.length && k < max; k++) {
```

**Cap 2** — final expansion result post loop:

```diff
- for (let k = 0; k < post.length; k++) {
+ for (let k = 0; k < post.length && expansions.length < max; k++) {
```

### 1.4 Full diff (commonjs/index.js)

```diff
+exports.EXPANSION_MAX = void 0;
+exports.EXPANSION_MAX = 100_000;

-function expand(str) {
+function expand(str, options = {}) {
+    const { max = exports.EXPANSION_MAX } = options;
-    return expand_(escapeBraces(str), true).map(unescapeBraces);
+    return expand_(escapeBraces(str), max, true).map(unescapeBraces);
```

### 1.5 Other Changes

| File           | Change                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| `package.json` | 5.0.0 → 5.0.1, removed inline prettier config, bumped `tap` to `^21.5.0` |
| `README.md`    | Added `max` option docs                                                  |

### 1.6 Security Implications

In 5.0.0, an input like `'{1..100}'.repeat(5)` could produce 100^5 = 10,000,000,000 expansions, causing memory exhaustion and a process hang. 5.0.1's default cap of 100,000 blocks this DoS vector.

---

## 2. Call Sites in the Project

### 2.1 Project Source

**No direct references.** Across the entire monorepo source (excluding `node_modules`), no direct import/require of `@isaacs/brace-expansion` was found.

### 2.2 Indirect Callers in node_modules

The monorepo contains exactly **2 call sites** via `minimatch@10.1.1`:

#### Caller 1: app-builder-lib (Electron build tool)

- **File**: `node_modules/app-builder-lib/node_modules/minimatch/dist/commonjs/index.js:157`
- **File**: `node_modules/app-builder-lib/node_modules/minimatch/dist/esm/index.js:151`
- **minimatch version**: 10.1.1
- **Dependency spec**: `"@isaacs/brace-expansion": "^5.0.0"`

```javascript
// commonjs/index.js:157
return (0, brace_expansion_1.expand)(pattern);

// esm/index.js:151
return expand(pattern);
```

**Purpose**: Electron build-time file matching (`extraResources`, `files`, etc.).

#### Caller 2: expo-splash-screen

- **File**: `node_modules/expo-splash-screen/node_modules/minimatch/dist/commonjs/index.js:157`
- **File**: `node_modules/expo-splash-screen/node_modules/minimatch/dist/esm/index.js:151`
- **minimatch version**: 10.1.1
- **Dependency spec**: `"@isaacs/brace-expansion": "^5.0.0"`

```javascript
return expand(pattern);
```

**Purpose**: Splash screen asset file matching.

### 2.3 Call Site Summary

| Caller                       | Call code         | Arg count | Uses `options`? |
| ---------------------------- | ----------------- | --------- | --------------- |
| app-builder-lib/minimatch    | `expand(pattern)` | 1         | No              |
| expo-splash-screen/minimatch | `expand(pattern)` | 1         | No              |

All callers pass only the `pattern` argument and do not use the new `options` parameter.

### 2.4 Install Locations

| Location                                    | Version     | Notes                     |
| ------------------------------------------- | ----------- | ------------------------- |
| Root `node_modules/@isaacs/brace-expansion` | 5.0.0       | hoisted                   |
| `apps/web/node_modules/`                    | not present | uses root hoisted version |
| `apps/wallet/node_modules/`                 | not present | uses root hoisted version |

---

## 3. Compatibility Assessment

| Change                           | 5.0.0         | 5.0.1                   | Compatibility                            |
| -------------------------------- | ------------- | ----------------------- | ---------------------------------------- |
| Function signature               | `expand(str)` | `expand(str, options?)` | Fully compatible — new param is optional |
| Return type                      | `string[]`    | `string[]`              | Unchanged                                |
| Return content                   | Unlimited     | Up to 100,000           | No impact in normal scenarios            |
| New export `EXPANSION_MAX`       | None          | `100_000`               | Does not affect existing code            |
| New type `BraceExpansionOptions` | None          | `{ max?: number }`      | Does not affect existing code            |

### Return Value Truncation Risk

5.0.1 caps results at 100,000 expansions. Both callers:

- **app-builder-lib**: glob patterns are simple paths like `**/*.js` — cannot trigger the cap
- **expo-splash-screen**: asset matchers are trivial — cannot trigger the cap

**Verdict: This upgrade is safe and has no negative impact on the project.**
