'use client';

import type { ImageProps as NextImageProps } from 'next/image.js';
import { memo, useState } from 'react';

import { Image as NextImage } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { isDomainOrSubdomainOf } from '@/helpers/isDomainOrSubdomainOf.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

function resolveImgurUrl(url: string) {
    if (!URL.canParse(url)) return;

    const u = new URL(url);
    if (u.protocol !== 'https:') return;
    if (u.host !== 'i.imgur.com') return;

    return `https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_jpg,w_144/${encodeURIComponent(url)}`;
}

function resolveAvatarFallbackUrl(url: string, isDarkMode = false) {
    if (!url?.startsWith('https://cdn.stamp.fyi/avatar/eth:')) return;
    return isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
}

export interface AvatarProps extends Omit<NextImageProps, 'src'> {
    size: number;
    src?: string;
    fallbackUrl?: string;
}

export const Avatar = memo(function Avatar({ src, size, className, fallbackUrl, ...rest }: AvatarProps) {
    const isDarkMode = useIsDarkMode();
    const [hasError, setHasError] = useState(false);

    const url =
        [resolveAvatarFallbackUrl, resolveImgurUrl].reduce((acc, fn) => (acc ? fn(acc, isDarkMode) : acc), src) ||
        fallbackUrl;

    const defaultFallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
    const isNormalUrl = !!src && !src.startsWith('data:image/') && !isDomainOrSubdomainOf(src, 'warpcast.com');
    const imageSrc = hasError ? defaultFallbackUrl : (isNormalUrl ? url : src) || src || defaultFallbackUrl;

    return (
        <NextImage
            {...rest}
            loading="lazy"
            unoptimized
            priority={false}
            className={classNames('relative z-10 max-w-none rounded-full bg-secondary object-cover', className)}
            style={{
                height: size,
                width: size,
                ...rest.style,
            }}
            src={imageSrc}
            width={size}
            height={size}
            alt={rest.alt}
            onError={() => setHasError(true)}
        />
    );
});
