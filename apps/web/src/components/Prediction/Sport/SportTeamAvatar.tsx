'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, useCallback, useEffect, useState } from 'react';

import { Image } from '@/esm/Image.js';

interface SportTeamAvatarProps {
    logo?: string;
    name?: string;
    abbreviation?: string;
    color?: string;
    size?: number;
    className?: string;
}

function getInitial(label: string | undefined): string {
    const text = label?.trim();
    if (!text) return '?';
    return text[0].toUpperCase();
}

export const SportTeamAvatar = memo<SportTeamAvatarProps>(function SportTeamAvatar({
    logo,
    name,
    abbreviation,
    color,
    size = 30,
    className,
}) {
    const [imageLoadFailed, setImageLoadFailed] = useState(!logo);
    const label = abbreviation || name;
    const showPlaceholder = !logo || imageLoadFailed;

    useEffect(() => {
        setImageLoadFailed(!logo);
    }, [logo]);

    const handleError = useCallback(() => {
        setImageLoadFailed(true);
    }, []);

    return (
        <div
            className={classNames(
                'relative shrink-0 overflow-hidden rounded-lg',
                showPlaceholder && !color ? 'bg-bg' : '',
                className,
            )}
            style={{
                width: size,
                height: size,
                backgroundColor: showPlaceholder && color ? color : undefined,
            }}
        >
            {showPlaceholder ? (
                <span
                    className={classNames(
                        'flex size-full items-center justify-center text-xs font-bold',
                        color ? 'text-white' : 'text-second',
                    )}
                    aria-hidden
                >
                    {getInitial(label)}
                </span>
            ) : (
                <Image
                    unoptimized={false}
                    quality={75}
                    fill
                    src={logo}
                    alt=""
                    className="object-cover"
                    onError={handleError}
                />
            )}
        </div>
    );
});
