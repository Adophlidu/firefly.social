'use client';

import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, memo } from 'react';

interface FootballLoadingProps extends HTMLProps<HTMLDivElement> {
    minHeight?: number | string;
    /** Diameter of the football in px. */
    size?: number;
}

export const FootballLoading = memo(function FootballLoading({
    className,
    minHeight = 500,
    size = 40,
}: FootballLoadingProps) {
    return (
        <div
            className={classNames('flex items-center justify-center text-main', className)}
            style={{
                minHeight,
            }}
            data-page-loading
            role="status"
            aria-label="Loading"
        >
            <span className="football-loading">
                {/* Plain <img> keeps the SVG markup out of the JS bundle; next/image is unsuitable for SVG. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/football.svg"
                    alt=""
                    width={size}
                    height={size}
                    className="football-loading__ball"
                    style={{ width: size, height: size }}
                />
                <span className="football-loading__shadow" style={{ width: size * 0.6 }} />
            </span>
        </div>
    );
});
