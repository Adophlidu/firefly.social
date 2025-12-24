import urlcat from 'urlcat';

import type {
    BetsPlatform,
    ProfileCategory,
    ProfilePageSource,
    SignupStep,
    Source,
    TipsDetailViewType,
} from '@/constants/enum.js';
import { SITE_URL } from '@/constants/static.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';

export class RouteResolver {
    static tx(chainId: number | string, hash: string, view?: TipsDetailViewType) {
        return urlcat(SITE_URL, '/tx/:chainId/:hash', {
            chainId,
            hash,
            view,
        });
    }

    static signup(step?: SignupStep) {
        return urlcat(SITE_URL, '/signup', {
            step,
        });
    }

    static swap() {}
    static profile(
        profile: { source: ProfilePageSource | Source.Firefly; profileId?: string; handle?: string },
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
    static betsProfile(
        address: string,
        {
            subPath,
            platform,
        }: {
            platform: BetsPlatform;
            subPath?: 'trades' | 'positions';
        },
    ) {
        return urlcat(SITE_URL, `/${platform}/profile/:address`, {
            address,
            tab: subPath,
        });
    }
}
