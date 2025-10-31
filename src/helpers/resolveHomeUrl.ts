import { unreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { HomeTab, PageRoute, Source } from '@/constants/enum.js';
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
