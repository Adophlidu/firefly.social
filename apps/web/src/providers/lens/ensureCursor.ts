import type { PageIndicator } from '@dimensiondev/utils';
import { isZero } from '@dimensiondev/web3/numbers';

export function ensureCursor(indicator?: PageIndicator) {
    return indicator?.id && !isZero(indicator.id) ? indicator.id : undefined;
}
