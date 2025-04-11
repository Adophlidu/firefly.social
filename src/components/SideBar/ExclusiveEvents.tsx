'use client';

import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { useHover } from 'usehooks-ts';

import { Link } from '@/components/Link.js';
import { PageRoute } from '@/constants/enum.js';
import { usePathname } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useMounted } from '@/hooks/useMounted.js';

export function ExclusiveEvents() {
    const mounted = useMounted();
    const pathname = usePathname();
    const isSelected = isRoutePathname(pathname, PageRoute.Events);
    const isDarkMode = useIsDarkMode();
    const linkRef = useRef<HTMLAnchorElement>(null!);
    const videoRef = useRef<HTMLVideoElement | null>(null!);
    const isHovering = useHover(linkRef);

    if (!mounted) return;

    return (
        <Link
            ref={linkRef}
            href={PageRoute.Events}
            className={classNames('sidebar-nav-link flex w-full text-lg leading-6 outline-none md:px-2', {
                'font-bold': isSelected,
            })}
            onMouseEnter={() => videoRef.current?.play()}
        >
            <span className="flex items-center gap-x-3 whitespace-nowrap rounded-lg px-2 py-2 md:px-4">
                <video
                    ref={videoRef}
                    src={isDarkMode ? '/webm/activity-icon-dark.webm' : '/webm/activity-icon-light.webm'}
                    poster={isDarkMode ? '/webm/poster/activity-icon-dark.png' : '/webm/poster/activity-icon-light.png'}
                    autoPlay
                    muted
                    loop={isHovering}
                    playsInline
                    webkit-playsinline
                    width={20}
                    height={20}
                    disablePictureInPicture
                    disableRemotePlayback
                    className="size-5"
                />
                <Trans>Exclusive Events</Trans>
            </span>
        </Link>
    );
}
