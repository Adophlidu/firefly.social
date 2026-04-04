export function isAbnormalFarHandle(handle: string) {
    return /^!\d+$/.test(handle);
}

export function resolveFidFromAbnormalFarHandle(handle: string) {
    return isAbnormalFarHandle(handle) ? handle.slice(1) : undefined;
}
