export function unreachable(value: never): never {
    console.error('Unhandled value: ', value);
    try {
        // @ts-expect-error
        value = String(value);
    } catch {}
    throw new Error('Unreachable case:' + value);
}

export function safeUnreachable(value: never) {
    console.error('Unhandled value: ', value);
}
