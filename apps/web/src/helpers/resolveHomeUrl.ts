import type { Source } from '@dimensiondev/enums';
import { HomeTab, PageRoute } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveHomeUrl(tab: HomeTab, source: Source) {
    switch (tab) {
        case HomeTab.Discover:
            return urlcat(PageRoute.Discover, {
                source: resolveSourceInUrl(source),
            });
        case HomeTab.Following:
            return urlcat(PageRoute.Following, {
                source: resolveSourceInUrl(source),
            });
        default:
            unreachable(tab);
    }
}
