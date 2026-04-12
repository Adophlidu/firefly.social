'use client';

import { classNames } from '@dimensiondev/utils';
import type { LinkProps } from 'next/link.js';
import { memo, type PropsWithChildren, useLayoutEffect, useRef } from 'react';

import { Link } from '@/components/Link.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import type { EventId } from '@/providers/types/Telemetry.js';

interface SourceTabProps extends PropsWithChildren<LinkProps> {
    isActive: boolean;
    telemetryEventId?: EventId;
    className?: string;
}

export const SourceTab = memo(function SourceTab({
    className,
    isActive,
    telemetryEventId: eventId,
    ...rest
}: SourceTabProps) {
    const tabRef = useRef<HTMLAnchorElement>(null);
    useLayoutEffect(() => {
        if (isActive && tabRef.current) {
            tabRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isActive]);
    return (
        <Link
            className={classNames(
                'active:bg-main/10 md:hover:text-highlight h-[43px] cursor-pointer border-b-4 px-3 text-center font-bold leading-[43px] md:h-[60px] md:py-[18px] md:leading-6',
                isActive ? 'border-highlight text-highlight' : 'text-third border-transparent',
                className,
            )}
            aria-current={isActive ? 'page' : undefined}
            ref={tabRef}
            {...rest}
            onClick={(e) => {
                if (eventId) TelemetryProvider.captureEventInSafe(eventId, {});
                rest.onClick?.(e);
            }}
        />
    );
});
