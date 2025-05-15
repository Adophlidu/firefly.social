'use client';

import { useQuery } from '@tanstack/react-query';
import type { ImageProps as NextImageProps } from 'next/image.js';
import { memo, useState } from 'react';
import { useUpdateEffect } from 'react-use';
import urlcat from 'urlcat';

import { STATUS } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { FIREFLY_STAMP_DEV_URL, FIREFLY_STAMP_URL } from '@/constants/index.js';
import { Image as NextImage } from '@/esm/Image.js';
import { classNames } from '@/helpers/classNames.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
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

export function useResolveAvatarFallbackUrl(src: string | undefined) {
    return useQuery({
        queryKey: ['avatar', src],
        enabled:
            env.external.NEXT_PUBLIC_FIREFLY_DEV_API === STATUS.Enabled
                ? src?.includes(FIREFLY_STAMP_DEV_URL)
                : src?.includes(FIREFLY_STAMP_URL),
        queryFn: async () => {
            if (!src) return null;
            const response = await fetch(src, {
                method: 'GET',
                redirect: 'manual',
                mode: 'cors',
            });

            if (response.type === 'opaqueredirect') {
                const result = await fetchJSON<{ twitterId: string }>(
                    urlcat('/api/twitter/getIdByAvatar', { target: src }),
                );
                const twitterId = result?.twitterId;
                if (!twitterId) return null;

                return urlcat('/api/twitter/user/:id/avatar', { id: twitterId });
            }

            return null;
        },
    });
}

export interface AvatarProps extends Omit<NextImageProps, 'src'> {
    size: number;
    src?: string;
    fallbackUrl?: string;
}

export const Avatar = memo(function Avatar({
    src,
    size,
    className,
    fallbackUrl: propsFallbackUrl,
    ...rest
}: AvatarProps) {
    const isDarkMode = useIsDarkMode();
    const [hasError, setHasError] = useState(false);

    const url = [resolveAvatarFallbackUrl, resolveImgurUrl].reduce((acc, fn) => (acc ? fn(acc, isDarkMode) : acc), src);

    const defaultFallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
    const fallbackUrl = propsFallbackUrl ?? defaultFallbackUrl;

    const isNormalUrl = !!src && !src.startsWith('data:image/') && !isDomainOrSubdomainOf(src, 'warpcast.com');

    const { data: xFallbackAvatar } = useResolveAvatarFallbackUrl(src);

    const imageSrc = hasError ? fallbackUrl : xFallbackAvatar || (isNormalUrl ? url : src) || src || fallbackUrl;

    useUpdateEffect(() => {
        setHasError(false);
    }, [xFallbackAvatar]);

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
