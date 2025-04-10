'use client';

import { useMotionValueEvent, useScroll } from 'framer-motion';
import { useState } from 'react';

import ComeBackIcon from '@/assets/comeback.svg';
import { NoSSR } from '@/components/NoSSR.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface TitleProps {
    group: ProfileGroup;
}

export function Title({ group }: TitleProps) {
    const [reached, setReached] = useState(false);

    const { scrollY } = useScroll();
    const isMedium = useIsMedium();

    useMotionValueEvent(scrollY, 'change', (value) => {
        setReached(value > 48);
    });

    const comeback = useComeBack();

    return (
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-primaryBottom px-4">
            <h1 className="flex items-center gap-7">
                <ComeBackIcon className="cursor-pointer text-lightMain" onClick={comeback} />
                <span className="text-xl font-black text-lightMain">{group.name ?? '-'}</span>
            </h1>

            <NoSSR>{(group && reached) || !isMedium ? <span /> : null}</NoSSR>
        </header>
    );
}
