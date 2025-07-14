import urlcat from 'urlcat';

import type { ProfileCategory, ProfilePageSource, TipsDetailViewType } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';

export class RouteResolver {
    static tip(hash: string, view?: TipsDetailViewType) {
        return urlcat(SITE_URL, '/tip/:hash', {
            hash,
            view,
        });
    }

    static tx(chainId: number | string, hash: string, view?: TipsDetailViewType) {
        return urlcat(SITE_URL, '/tx/:chainId/:hash', {
            chainId,
            hash,
            view,
        });
    }

    static swap() {}
    static profile(
        profile: { source: ProfilePageSource; profileId?: string; handle?: string },
        category?: ProfileCategory,
        isCurrentProfile?: boolean,
    ) {
        return getProfileUrl(profile, category, isCurrentProfile);
    }
    static post() {}
    static club() {}
    static token() {}
    static nft() {}
    static article() {}
}
