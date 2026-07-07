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
        options?: { multiple?: boolean; appendRoot?: boolean; chartView?: 'stats' | 'stream' },
    ) {
        const appendRoot = options?.appendRoot ?? false;
        return urlcat(appendRoot ? SITE_URL : '', '/:platform/event/:eventId', {
            platform,
            eventId,
            type: options?.multiple ? 'multi' : undefined,
            'chart-view': options?.chartView,
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
        slugs,
        tab,
        appendRoot = true,
    }: {
        // Path mirrors the slug tree: `[primary, secondary?, tertiary?]`. A single string is
        // normalized to a one-segment path. Slugs are joined verbatim (no encoding) so the
        // multi-segment catch-all route receives a real `/primary/secondary/tertiary` path.
        slugs: string | string[];
        tab?: 'games' | 'props';
        appendRoot?: boolean;
    }) {
        const segments = (Array.isArray(slugs) ? slugs : [slugs]).filter(Boolean);
        const path = segments.join('/') || 'trending';
        return urlcat(appendRoot ? SITE_URL : '', `/prediction/category/${path}`, {
            tab: tab && tab !== 'games' ? tab : undefined,
        });
    }
}
