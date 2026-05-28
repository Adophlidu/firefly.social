'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { Avatar, type AvatarProps } from '@/components/Avatar.js';
import { getFifaCampAvatarRingUrl } from '@/components/FifaCamp/getFifaCampFlagUrl.js';
import { Image } from '@/components/Image.js';

/** Figma 5800:236 — reference dimensions from world-cup AvatarBadge */
const BASE_PHOTO_SIZE = 135.68;
const BASE_KEYLINE = 2.5;
const BASE_RING_INNER = 150;
const BASE_OUTER = 160;
const BASE_FLAG_HEIGHT = 40;
const BASE_FLAG_WIDTH = 59.88;
const BASE_FLAG_BORDER = 3;
const BASE_FLAG_RADIUS = 8;

interface FifaCampAvatarProps extends AvatarProps {
    countryCode?: string;
    flagUrl?: string | null;
}

export const FifaCampAvatar = memo<FifaCampAvatarProps>(function FifaCampAvatar({
    countryCode,
    flagUrl,
    size,
    className,
    ...avatarProps
}) {
    const flagSrc = flagUrl?.trim();
    if (!countryCode || !flagSrc) {
        return <Avatar size={size} className={className} {...avatarProps} />;
    }

    const scale = size / BASE_OUTER;
    const outerSize = size;
    const photoSize = Math.round(BASE_PHOTO_SIZE * scale);
    const keyline = BASE_KEYLINE * scale;
    const frameSize = photoSize + keyline * 2;
    const ringInner = BASE_RING_INNER * scale;
    const flagHeight = BASE_FLAG_HEIGHT * scale;
    const flagWidth = BASE_FLAG_WIDTH * scale;
    const flagBorder = BASE_FLAG_BORDER * scale;
    const flagRadius = BASE_FLAG_RADIUS * scale;
    return (
        <div
            className={classNames('pointer-events-none relative shrink-0', className)}
            style={{ width: outerSize, height: outerSize }}
        >
            <div
                aria-hidden
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ width: ringInner, height: ringInner }}
            />

            <img
                src={getFifaCampAvatarRingUrl()}
                alt=""
                width={Math.round(outerSize)}
                height={Math.round(outerSize)}
                className="absolute inset-0 z-1 size-full"
                aria-hidden
                decoding="async"
            />

            <div
                className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white"
                style={{
                    width: frameSize,
                    height: frameSize,
                    padding: keyline,
                }}
            >
                <Avatar size={photoSize} className="rounded-full" {...avatarProps} />
            </div>

            <div
                className="absolute z-20 overflow-hidden border-solid border-white bg-white"
                style={{
                    bottom: 0,
                    right: outerSize * 0.05,
                    height: flagHeight,
                    width: flagWidth,
                    borderWidth: flagBorder,
                    borderRadius: flagRadius,
                }}
            >
                <Image
                    src={flagSrc}
                    alt=""
                    width={Math.round(flagWidth)}
                    height={Math.round(flagHeight)}
                    className="size-full object-cover"
                    aria-hidden
                />
            </div>
        </div>
    );
});
