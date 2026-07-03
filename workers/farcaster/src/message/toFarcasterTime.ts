const FARCASTER_EPOCH = 16094592e5;

export function toFarcasterTime(time: number) {
    if (time < FARCASTER_EPOCH) {
        throw new Error('time must be after Farcaster epoch (01/01/2021)');
    }
    const secondsSinceEpoch = Math.round((time - FARCASTER_EPOCH) / 1e3);
    if (secondsSinceEpoch > 2 ** 32 - 1) {
        throw new Error('time too far in future');
    }
    return secondsSinceEpoch;
}
