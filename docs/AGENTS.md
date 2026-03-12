# Agent Guidelines

Guidance for AI coding assistants working on this codebase.

## Provider Interface (`src/providers/types/SocialMedia.ts`)

### Parameter Ordering

When defining or implementing Provider methods:

1. **Logical parameters first** – Put all domain/functional parameters before pagination and control params.
2. **`indicator` after logical params** – The optional `PageIndicator` for pagination comes after all logical parameters.
3. **`indicator` is optional** – It should be the last pagination-related param before `signal`.
4. **`signal` last** – If the method supports `AbortSignal`, it must be the last parameter.

**Order:** `(logicalParams..., indicator?, signal?)`

### Examples

```typescript
// ✅ Correct: logical params → indicator
getNotifications(highSignalFilter?: boolean, indicator?: PageIndicator)
getSuggestedFollows(includeFollowingStatus?: boolean, locale?: Locale, indicator?: PageIndicator)
searchPosts(q: string, fullMatch?: boolean, indicator?: PageIndicator)

// ✅ Correct: logical params → indicator → signal
discoverPostsById(profileId: string, indicator?: PageIndicator, signal?: AbortSignal)

// ❌ Wrong: indicator before logical params
getNotifications(indicator?: PageIndicator, highSignalFilter?: boolean)
searchPosts(q: string, indicator?: PageIndicator, fullMatch?: boolean)
```
