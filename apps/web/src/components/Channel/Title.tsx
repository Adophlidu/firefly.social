'use client';

import ComeBackIcon from '@dimensiondev/assets/comeback.svg';
import { useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';

import { ChannelInfoAction } from '@/components/Channel/ChannelInfoAction.js';
import { NoSSR } from '@/components/NoSSR.js';
import { resolveChannelName } from '@/helpers/resolveChannelName.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

interface TitleProps {
    channel: Channel;
}

export function Title({ channel }: TitleProps) {
    const [reached, setReached] = useState(false);

    const { scrollY } = useScroll();
    const isMedium = useIsMedium();

    useMotionValueEvent(scrollY, 'change', (value) => {
        setReached(value > 48);
    });

    const comeback = useComeBack();

    return (
        <header className="border-line bg-primaryBottom sticky top-0 z-30 flex h-[60px] items-center justify-between border-b pl-4 pr-3">
            <h1 className="flex min-w-0 items-center gap-7">
                <ComeBackIcon className="text-lightMain shrink-0 cursor-pointer" onClick={comeback} />
                <span className="text-lightMain min-w-0 truncate text-xl font-black">
                    {resolveChannelName(channel) || '-'}
                </span>
            </h1>

            <NoSSR>{(channel && reached) || !isMedium ? <ChannelInfoAction channel={channel} /> : null}</NoSSR>
        </header>
    );
}
