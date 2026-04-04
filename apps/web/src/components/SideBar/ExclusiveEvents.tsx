'use client';

import { Trans } from '@lingui/react/macro';
import { memo, useRef } from 'react';
import { useHover } from 'usehooks-ts';

import { BaseMenuItem } from '@/components/SideBar/BaseMenuItem.js';
import { PageRoute } from '@/constants/enum.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useMounted } from '@/hooks/useMounted.js';

interface ExclusiveEventsProps {
    isSelected: boolean;
    collapsed: boolean;
}

export const ExclusiveEvents = memo<ExclusiveEventsProps>(function ExclusiveEvents({ isSelected, collapsed }) {
    const mounted = useMounted();
    const isDarkMode = useIsDarkMode();
    const linkRef = useRef<HTMLAnchorElement>(null!);
    const videoRef = useRef<HTMLVideoElement | null>(null!);
    const isHovering = useHover(linkRef);

    if (!mounted) return;

    return (
        <BaseMenuItem
            ref={linkRef}
            href={PageRoute.Events}
            isSelected={isSelected}
            collapsed={collapsed}
            menuName={<Trans>Exclusive Events</Trans>}
            icon={
                <video
                    ref={videoRef}
                    src={isDarkMode ? '/webm/activity-icon-dark.webm' : '/webm/activity-icon-light.webm'}
                    poster={isDarkMode ? '/webm/poster/activity-icon-dark.png' : '/webm/poster/activity-icon-light.png'}
                    autoPlay
                    muted
                    loop={isHovering}
                    playsInline
                    webkit-playsinline="true"
                    width={20}
                    height={20}
                    disablePictureInPicture
                    disableRemotePlayback
                    className="size-5"
                />
            }
            onMouseEnter={() => videoRef.current?.play()}
        />
    );
});
