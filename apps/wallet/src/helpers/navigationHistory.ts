/**
 * A minimal navigation history stack for the wallet iframe. @dimensiondev/ssr's
 * memory history does not keep entries, so `history.back()` cannot work; this
 * stack is fed from the root RouteChangedHandler and backs useComeback().
 */
const stack: string[] = [];

/** Record the current location; call on initial render and after every navigation. */
export function recordNavigation(pathname: string, search: string): void {
    const entry = search ? `${pathname}?${search}` : pathname;
    if (stack[stack.length - 1] === entry) return;
    stack.push(entry);
}

/**
 * Replace the current top entry (for `navigate(..., { replace: true })`);
 * behaves like recordNavigation when the stack is empty.
 */
export function replaceNavigation(pathname: string, search: string): void {
    const entry = search ? `${pathname}?${search}` : pathname;
    if (stack.length === 0) {
        stack.push(entry);
        return;
    }
    stack[stack.length - 1] = entry;
}

/**
 * Drop the current entry and return the previous one (pathname + search), or
 * undefined when there is nowhere to go back to.
 */
export function popNavigation(): string | undefined {
    if (stack.length <= 1) return undefined;
    stack.pop();
    return stack[stack.length - 1];
}
