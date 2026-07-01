import type { PredictionPlatform } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { useMemo } from 'react';

import { extractFallbackInfo } from '@/components/Prediction/extractFallbackInfo.js';
import { useProxyWalletInfo } from '@/hooks/prediction/useProxyWalletInfo.js';

interface Options {
    platform: PredictionPlatform;
    address: string;
    fallbackInfo?: {
        name?: string;
        avatar?: string;
    };
}

export function usePredictionProfileData({ platform, address, fallbackInfo }: Options) {
    const { data: socialProfile, isLoading } = useProxyWalletInfo(platform, address);

    const {
        name: socialName,
        avatar: socialAvatar,
        handle,
        source,
        profileId,
    } = useMemo(() => {
        if (!socialProfile || (!socialProfile.account && !!fallbackInfo?.name))
            return { name: undefined, avatar: undefined };

        return extractFallbackInfo(socialProfile, [
            Source.Firefly,
            Source.Twitter,
            Source.Lens,
            Source.Farcaster,
            Source.Bsky,
            Source.Wallet,
        ]);
    }, [socialProfile, fallbackInfo?.name]);

    return {
        source,
        profileId,
        isLoading,
        socialProfile,
        handle,
        name: socialName || fallbackInfo?.name,
        avatar: socialAvatar || fallbackInfo?.avatar,
    };
}
