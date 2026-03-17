import { useMemo } from 'react';

import { extractFallbackInfo } from '@/components/Prediction/extractFallbackInfo.js';
import { type PredictionPlatform, Source } from '@/constants/enum.js';
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
        source,
        profileId,
    } = useMemo(() => {
        if (!socialProfile) return { name: undefined, avatar: undefined };

        return extractFallbackInfo(socialProfile, [
            Source.Twitter,
            Source.Lens,
            Source.Farcaster,
            Source.Bsky,
            Source.Wallet,
        ]);
    }, [socialProfile]);

    return {
        source,
        profileId,
        isLoading,
        socialProfile,
        name: socialName || fallbackInfo?.name,
        avatar: socialAvatar || fallbackInfo?.avatar,
    };
}
