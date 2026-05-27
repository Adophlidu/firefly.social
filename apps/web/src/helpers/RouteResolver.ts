import type {
    PredictionPlatform,
    ProfileCategory,
    ProfilePageSource,
    SignupStep,
    Source,
    TipsDetailViewType,
} from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

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
        return urlcat(`/${platform}/profile/:address`, {
            address,
            tab: subPath,
        });
    }
    static betsEventDetail(
        platform: PredictionPlatform,
        eventId: string,
        options?: { multiple?: boolean; appendRoot?: boolean; stream?: boolean },
    ) {
        const appendRoot = options?.appendRoot ?? false;
        return urlcat(appendRoot ? SITE_URL : '', '/:platform/event/:eventId', {
            platform,
            eventId,
            type: options?.multiple ? 'multi' : undefined,
            'chart-view': options?.stream ? 'stream' : undefined,
        });
    }
    static explorePrediction({
        slug,
        subSlug,
        appendRoot = true,
    }: {
        slug?: string;
        subSlug?: string;
        appendRoot?: boolean;
    }) {
        return urlcat(appendRoot ? SITE_URL : '', `/explore/prediction/:slug`, {
            slug: slug || 'trending',
            subSlug: subSlug || undefined,
        });
    }

    static predictionCategory({
        slug,
        tab,
        tagType,
        parentSlug,
        parentTagType,
        appendRoot = true,
    }: {
        slug: string;
        tab?: 'games' | 'props';
        tagType?: string;
        parentSlug?: string;
        parentTagType?: string;
        appendRoot?: boolean;
    }) {
        return urlcat(appendRoot ? SITE_URL : '', '/prediction/category/:slug', {
            slug,
            tab: tab && tab !== 'games' ? tab : undefined,
            tagType: tagType || undefined,
            parentSlug: parentSlug || undefined,
            parentTagType: parentTagType || undefined,
        });
    }
}
