# Code Quality Patterns

Focus on patterns that cause real bugs. Claude already knows basic React — these are the non-obvious gotchas.

## 1. React Hooks Safety

### eslint-disable hiding dependency bugs

```typescript
// Red flag: WHY is this disabled? Read the suppressed deps.
useEffect(() => {
    doSomething(someValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

If `someValue` changes, this effect won't re-run. Either add the dep or explain why it's safe.

### Missing cleanup with early return

```typescript
// Bug: early return skips cleanup registration
useEffect(() => {
  const timer = setInterval(() => { ... }, 1000);
  if (condition) return;  // timer leaks!
  return () => clearInterval(timer);
}, []);

// Fix: always register cleanup before early return
useEffect(() => {
  if (condition) return () => {};
  const timer = setInterval(() => { ... }, 1000);
  return () => clearInterval(timer);
}, []);
```

### Async validation without abort

```typescript
// Bug: stale result overwrites fresh one
useEffect(() => {
    validateAsync(value).then(setResult);
}, [value]);

// Fix: abort on dependency change
useEffect(() => {
    const controller = new AbortController();
    validateAsync(value, controller.signal).then(setResult);
    return () => controller.abort();
}, [value]);
```

## 2. Concurrent Request Control

### Sequential await in loop

```typescript
// 500 items = 500 serial API calls = 50+ seconds
for (const handle of handles) {
    await resolveProfile(handle);
}

// Fix: concurrent with rate limiting
import pLimit from 'p-limit';
const limit = pLimit(10);
await Promise.all(
    handles.map((h) => limit(() => resolveProfile(h))),
);
```

### Polling without request guard

```typescript
// Bug: requests stack up if previous one is still pending
const interval = setInterval(() => fetchData(), 1000);

// Fix: guard with ref
const isLoading = useRef(false);
const interval = setInterval(async () => {
    if (isLoading.current) return;
    isLoading.current = true;
    try {
        await fetchData();
    } finally {
        isLoading.current = false;
    }
}, 1000);
```

## 3. Race Conditions & Cleanup

### State update after unmount

```typescript
// Fix: isMounted guard
useEffect(() => {
    let isMounted = true;
    fetchData().then((data) => {
        if (isMounted) setState(data);
    });
    return () => {
        isMounted = false;
    };
}, []);
```

### Captured ref in cleanup

```typescript
// Bug: ref.current may change between render and cleanup
useEffect(() => {
    return () => {
        audioRef.current?.pause(); // May crash or hit the wrong instance
    };
}, []);

// Fix: capture ref value before cleanup
useEffect(() => {
    const audio = audioRef.current;
    return () => {
        audio?.pause();
    };
}, []);
```

### Modal close + navigation race

```typescript
// Bug: navigation fires while modal is still tearing down
modal.close();
router.push('/next');

// Fix: wait for the modal lifecycle
modal.close();
await new Promise((r) => setTimeout(r, 100));
router.push('/next');
```

## 4. Stale Data

### Cache not cleared on context switch

```typescript
// Bug: old provider list shown when switching social network
useEffect(() => {
    fetchProviders(network).then(setProviders);
}, [network]);

// Fix: clear before fetching
useEffect(() => {
    setProviders([]); // Clear stale data immediately
    fetchProviders(network).then(setProviders);
}, [network]);
```

### Callback ref going stale

```typescript
// Bug: callback captured at setup time, never updates
useEffect(() => {
    const saved = onUpdate; // Stale!
    const interval = setInterval(
        () => saved(getData()),
        1000,
    );
    return () => clearInterval(interval);
}, []); // Missing onUpdate dep

// Fix: use ref for latest value
const onUpdateRef = useRef(onUpdate);
onUpdateRef.current = onUpdate;
useEffect(() => {
    const interval = setInterval(
        () => onUpdateRef.current(getData()),
        1000,
    );
    return () => clearInterval(interval);
}, []);
```

## 5. Debounced Async Validation

### Promise never resolves (react-hook-form hangs)

```typescript
// Bug: debounced function doesn't return promise — form waits forever
rules={{ validate: (value) => { debouncedValidate(value); return true; } }}

// Fix: return the promise, cleanup on unmount
const debouncedValidate = useCallback((value: string) => {
  return new Promise<boolean>((resolve) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      resolve(await validate(value));
    }, 300);
  });
}, [validate]);

useEffect(() => () => {
  clearTimeout(timeoutRef.current);
}, []);
```

## 6. Error Handling (Non-Obvious Cases)

### Silent early return — user clicks, nothing happens

```typescript
// Bug: no feedback when validation fails
const handleSubmit = () => {
    if (!data) return; // User sees nothing
};

// Fix: tell the user (via Lingui-translated message)
import { t } from '@lingui/core/macro';
import { Toast } from '#/components/Toast.js';

if (!data) {
    Toast.warning({
        title: t`Please fill in required fields`,
    });
    return;
}
```

### Catch swallows error in critical path

Look for `catch {}` or `catch(e) { console.error(e) }` in Web3 transactions, signing, session-token refreshes, and post-publishing flows — these MUST surface errors to the user.

## 7. Next.js Server/Client Boundary

### Server component accidentally importing a client-only module

```typescript
// Bug: page imports a hook that calls useState — but page has no 'use client'
// app/feed/page.tsx
import { useFeed } from '#/hooks/useFeed.js'; // hook uses useState
```

The build will fail or the page will silently render on the server with broken hydration. Either:

- Add `'use client'` (as the first line of the file).
- Move the client-only logic into a child client component.

### `'use client'` not on the first line

```typescript
// Bug: directive ignored because it's not the first line
import { foo } from '#/...';
('use client');

// Fix: directive first, then a blank line, then imports
('use client');

import { foo } from '#/...';
```
