'use client';

import { BET_PROFILE_FOLLOW_BUTTON_ID } from '@dimensiondev/constants/static';
import type { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { useEffect } from 'react';

import { Comeback } from '@/components/Comeback.js';
import { PredictionProfileFollowButton } from '@/components/Prediction/PredictionProfileFollowButton.js';
import { usePredictionProfileData } from '@/hooks/prediction/usePredictionProfileData.js';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver.js';

interface PredictionProfilePageHeaderProps {
    address: string;
    platform: PredictionPlatform;
    fallbackName?: string;
}

export function PredictionProfilePageHeader({ address, platform, fallbackName }: PredictionProfilePageHeaderProps) {
    const { name } = usePredictionProfileData({ address, platform, fallbackInfo: { name: fallbackName } });
    const [followButtonRef, followButtonEntry] = useIntersectionObserver({
        threshold: 0.2,
        rootMargin: '-60px 0px 0px',
    });
    useEffect(() => {
        const element = document.getElementById(BET_PROFILE_FOLLOW_BUTTON_ID);
        if (element) {
            followButtonRef(element);
        }
    }, [followButtonRef]);

    const showFollowButton = !!followButtonEntry && !followButtonEntry.isIntersecting;

    return (
        <div className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
            <div className="flex min-w-0 items-center gap-2">
                <Comeback className="cursor-pointer text-lightMain" />
                {name && showFollowButton ? (
                    <span className="min-w-0 truncate text-xl font-black text-main">{name}</span>
                ) : null}
            </div>
            <div className={classNames('ml-auto shrink-0', !showFollowButton ? 'pointer-events-none opacity-0' : '')}>
                <PredictionProfileFollowButton address={address} platform={platform} />
            </div>
        </div>
    );
}
