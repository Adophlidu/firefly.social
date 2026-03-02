# Error Classes

A collection of typed error classes for granular error handling and classification.

## Overview

```typescript
import {
    SeverityError,
    AbortError,
    InvalidResultError,
    TimeoutError,
    UnreachableError,
    NotImplementedError,
    NotAllowedError,
    NotFoundError,
    AuthenticationError,
    UnauthorizedError,
    ForbiddenError,
    NetworkError,
    UserRejectionError,
} from '@dimensiondev/utils';
```

---

## `SeverityError`

Base class for errors that carry a severity level for logging and monitoring.

```typescript
throw new SeverityError('Payment failed', 'fatal');

// Levels: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'
```

**Reference**

```typescript
class SeverityError extends Error {
    name: 'SeverityError';
    level:
        | 'fatal'
        | 'error'
        | 'warning'
        | 'log'
        | 'info'
        | 'debug';
    constructor(
        message: string,
        level?:
            | 'fatal'
            | 'error'
            | 'warning'
            | 'log'
            | 'info'
            | 'debug',
    );
}
```

Default `level` is `'log'`.

---

## `AbortError`

Signals that an operation was intentionally cancelled via an `AbortSignal`.

```typescript
if (signal?.aborted) throw new AbortError();

// Detection helper
if (AbortError.is(error)) {
    // handle cancellation
}
```

**Reference**

```typescript
class AbortError extends Error {
    name: 'AbortError';
    constructor(message?: string);
    static is(error: unknown): boolean;
}
```

`AbortError.is` returns `true` for any error whose `name` is `'AbortError'`, matching both this class and the browser's native abort errors.

---

## `InvalidResultError`

Thrown when an operation produces a result that does not meet validity requirements. Used by [`retry`](./retry.md) to trigger another attempt.

```typescript
const data = await fetchData();
if (!isValid(data))
    throw new InvalidResultError(
        'Unexpected response shape',
    );
```

**Reference**

```typescript
class InvalidResultError extends Error {}
```

---

## `TimeoutError`

Thrown when an operation exceeds its time limit.

```typescript
throw new TimeoutError('Connection timed out after 5 s');
```

**Reference**

```typescript
class TimeoutError extends Error {
    constructor(message?: string);
}
```

---

## `UnreachableError`

Thrown at code paths that should be unreachable. Useful in `switch`/`if` exhaustiveness checks.

```typescript
switch (status) {
    case 'active':
        return handleActive();
    case 'inactive':
        return handleInactive();
    default:
        throw new UnreachableError('status', status);
}
```

**Reference**

```typescript
class UnreachableError extends Error {
    constructor(label: string, value: unknown);
}
```

See also: [`unreachable`](./unreachable.md) for a function-based alternative.

---

## `NotImplementedError`

Placeholder for features that are planned but not yet implemented.

```typescript
function exportToPDF() {
    throw new NotImplementedError(
        'PDF export is not yet available',
    );
}
```

**Reference**

```typescript
class NotImplementedError extends Error {
    constructor(message?: string);
}
```

---

## `NotAllowedError`

Thrown when an action is structurally forbidden by business logic (not authentication/authorization).

```typescript
if (user.role !== 'admin')
    throw new NotAllowedError(
        'Only admins can delete posts',
    );
```

**Reference**

```typescript
class NotAllowedError extends Error {
    constructor(message?: string);
}
```

---

## `NotFoundError`

Thrown when a requested resource does not exist.

```typescript
const post = await db.posts.findById(id);
if (!post) throw new NotFoundError(`Post ${id} not found`);
```

**Reference**

```typescript
class NotFoundError extends Error {
    constructor(message?: string);
}
```

---

## `AuthenticationError`

Extends `SeverityError`. Thrown when authentication fails (invalid credentials, expired token, etc.).

```typescript
throw new AuthenticationError(
    'Session expired, please sign in again',
);
```

**Reference**

```typescript
class AuthenticationError extends SeverityError {
    constructor(message?: string);
}
```

Default severity level is `'log'`.

---

## `UnauthorizedError`

Thrown when a request lacks valid authentication credentials (HTTP 401 equivalent).

```typescript
if (!request.headers.authorization)
    throw new UnauthorizedError();
```

**Reference**

```typescript
class UnauthorizedError extends Error {
    constructor(message?: string);
}
```

---

## `ForbiddenError`

Thrown when the authenticated user lacks permission for the requested resource (HTTP 403 equivalent).

```typescript
if (!canEdit(user, post))
    throw new ForbiddenError('You cannot edit this post');
```

**Reference**

```typescript
class ForbiddenError extends Error {
    constructor(message?: string);
}
```

---

## `NetworkError`

Thrown when a network request fails due to connectivity issues.

```typescript
fetch(url).catch(() => {
    throw new NetworkError('Failed to reach server');
});
```

**Reference**

```typescript
class NetworkError extends Error {
    constructor(message?: string);
}
```

---

## `UserRejectionError`

Thrown when a user explicitly declines an action (e.g., dismisses a wallet confirmation dialog).

```typescript
// In a wallet integration
provider
    .request({ method: 'eth_sendTransaction' })
    .catch((err) => {
        if (err.code === 4001)
            throw new UserRejectionError(
                'Transaction rejected by user',
            );
    });
```

**Reference**

```typescript
class UserRejectionError extends Error {
    constructor(message?: string);
}
```
