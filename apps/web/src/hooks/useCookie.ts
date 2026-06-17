import type { SiteCookies } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';

import { getClientCookies } from '@/helpers/getCookies.js';

export function useCookie(key: SiteCookies) {
    if (bom.document) return getClientCookies(key);
    // During SSR of client components, return empty.
    // The real value is read client-side after hydration.
    return '';
}
