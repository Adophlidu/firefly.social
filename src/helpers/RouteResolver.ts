import urlcat from 'urlcat';

import {
    type PredictionPlatform,
    type ProfileCategory,
    type ProfilePageSource,
    type SignupStep,
    type Source,
    type TipsDetailViewType,
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
            platform: PredictionPlatform;
            subPath?: 'trades' | 'positions';
        },
    ) {
        return urlcat(SITE_URL, `/${platform}/profile/:address`, {
            address,
            tab: subPath,
        });
    }
    static betsEventDetail(platform: PredictionPlatform, eventId: string, options?: { multiple?: boolean }) {
        return urlcat(SITE_URL, '/:platform/event/:eventId', {
            platform,
            eventId,
            type: options?.multiple ? 'multi' : undefined,
        });
    }
    static explorePrediction(slug?: string, subSlug?: string) {
        return urlcat(SITE_URL, `/explore/prediction/:slug`, {
            slug: slug || 'trending',
            subSlug: subSlug || undefined,
        });
    }
}
