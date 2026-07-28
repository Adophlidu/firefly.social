import type { PerpsIntent } from '@dimensiondev/iframe-bridge';

export type PerpsAccountTab = 'positions' | 'orders';

export function getPerpsAccountTab(intent?: PerpsIntent): PerpsAccountTab {
    return intent?.kind === 'cancel-all' || intent?.kind === 'cancel-order' || intent?.kind === 'modify-order'
        ? 'orders'
        : 'positions';
}
