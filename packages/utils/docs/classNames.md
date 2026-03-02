# `classNames`

Joins CSS class names together, skipping falsy values and conditionally including object keys.

## Usage

```typescript
import { classNames } from '@dimensiondev/utils';

// String arguments
classNames('btn', 'primary');
// → 'btn primary'

// Conditional object syntax
classNames('btn', {
    active: isActive,
    disabled: !isEnabled,
});
// → 'btn active'  (when isActive=true, isEnabled=true)

// Mixed with falsy guards
classNames(
    'card',
    isLoading && 'card--loading',
    null,
    undefined,
);
// → 'card card--loading'  (when isLoading=true)
```

React component example:

```tsx
function Button({
    variant,
    disabled,
    className,
}: ButtonProps) {
    return (
        <button
            className={classNames(
                'btn',
                `btn--${variant}`,
                { 'btn--disabled': disabled },
                className,
            )}
        >
            Click me
        </button>
    );
}
```

## Reference

```typescript
function classNames(
    ...classes: Array<
        string | null | undefined | Record<string, boolean>
    >
): string;
```

- `classes` — any number of arguments, each of which may be:
    - `string` — included as-is (whitespace-only strings are ignored).
    - `Record<string, boolean>` — each key is included only when its value is `true`.
    - `null` / `undefined` / `false` — silently skipped.
- Returns a single space-separated class string.

## Notes

- Leading and trailing whitespace in string values and object keys is preserved in the join but individual tokens are trimmed before inclusion.
- For complex conditional logic, prefer the object syntax over `&&` string expressions for clarity.
