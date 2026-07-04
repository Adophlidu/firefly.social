'use client';

import { PageRoute } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { memo, type MutableRefObject, useCallback, useEffect, useRef } from 'react';
import { useHover } from 'usehooks-ts';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';

interface ExclusiveEventsProps {
    isSelected: boolean;
    collapsed: boolean;
}

const VIDEO_VARIANTS = {
    light: {
        src: '/webm/activity-icon-light.webm',
        poster: '/webm/poster/activity-icon-light.png',
    },
    dark: {
        src: '/webm/activity-icon-dark.webm',
        poster: '/webm/poster/activity-icon-dark.png',
    },
} as const;

interface ActivityIconVideoProps {
    loop: boolean;
    registerPlay: MutableRefObject<() => void>;
}

function ActivityIconVideo({ loop, registerPlay }: ActivityIconVideoProps) {
    const lightRef = useRef<HTMLVideoElement>(null);
    const darkRef = useRef<HTMLVideoElement>(null);

    const playActiveVideo = useCallback(() => {
        const isDark = document.documentElement.classList.contains('dark');
        const video = isDark ? darkRef.current : lightRef.current;
        if (!video) return;

        void video.play().catch(() => {});
    }, []);

    useEffect(() => {
        registerPlay.current = playActiveVideo;
    }, [playActiveVideo, registerPlay]);

    useEffect(() => {
        playActiveVideo();
    }, [playActiveVideo, loop]);

    const sharedProps = {
        autoPlay: true,
        muted: true,
        loop,
        playsInline: true,
        width: 20,
        height: 20,
        disablePictureInPicture: true,
        disableRemotePlayback: true,
    } as const;

    return (
        <>
            <video ref={lightRef} {...VIDEO_VARIANTS.light} {...sharedProps} className="size-5 dark:hidden" />
            <video ref={darkRef} {...VIDEO_VARIANTS.dark} {...sharedProps} className="hidden size-5 dark:block" />
        </>
    );
}

export const ExclusiveEvents = memo<ExclusiveEventsProps>(function ExclusiveEvents({ isSelected, collapsed }) {
    const linkRef = useRef<HTMLAnchorElement>(null!);
    const playActiveVideoRef = useRef<() => void>(() => {});
    const isHovering = useHover(linkRef);

    return (
        <BaseMenuItem
            ref={linkRef}
            href={PageRoute.Events}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Exclusive Events</Trans>}
            icon={<ActivityIconVideo loop={isHovering} registerPlay={playActiveVideoRef} />}
            onMouseEnter={() => playActiveVideoRef.current()}
        />
    );
});
