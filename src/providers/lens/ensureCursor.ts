import { isZero } from '@/helpers/number.js';
import { type PageIndicator } from '@/helpers/pageable.js';

export function ensureCursor(indicator?: PageIndicator) {
    return indicator?.id && !isZero(indicator.id) ? indicator.id : undefined;
}
