import type { PageIndicator } from '@dimensiondev/utils';

import { isZero } from '@/helpers/number.js';

export function ensureCursor(indicator?: PageIndicator) {
    return indicator?.id && !isZero(indicator.id) ? indicator.id : undefined;
}
