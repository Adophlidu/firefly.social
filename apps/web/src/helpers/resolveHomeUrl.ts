import { HomeTab, PageRoute, Source } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveHomeUrl(tab: HomeTab, source: Source) {
    // The World Cup tab renders a dedicated feed page (<WorldCupTimeline/> at
    // /world-cup-feed), not a source-filtered discover view. Route there directly
    // instead of ?source=world-cup, which narrowToSocialSource would otherwise
    // collapse to the Farcaster feed.
    if (source === Source.WorldCup) return PageRoute.WorldCupFeed;

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
