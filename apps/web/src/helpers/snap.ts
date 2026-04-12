import type { Snap } from '@/types/snap.js';

export function isSnap(value: unknown): value is Snap {
    return (
        typeof value === 'object' &&
        value !== null &&
        'version' in value &&
        (value as Snap).version === '2.0' &&
        'ui' in value
    );
}
