'use client';

import { classNames, parseUrl } from '@dimensiondev/utils';
import type { ImageProps as NextImageProps } from 'next/image.js';
import { memo, useMemo, useState } from 'react';

import { Image as NextImage } from '@/esm/Image.js';
import { matchDomainSuffix } from '@/helpers/matchDomainSuffix.js';
import { optimizeCDNImageSize } from '@/helpers/optimizeCDNImageSize.js';
import { useDefaultFireflyAvatar } from '@/hooks/useDefaultFireflyAvatar.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

// URLs that have already failed to load (e.g. imgur 429s). Shared across all Avatar
// instances and persists across remounts so a known-bad URL is never requested again.
const failedAvatarUrls = new Set<string>();

function resolveImgurUrl(url: string) {
    const u = parseUrl(url);
    if (!u) return;

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

export const Avatar = memo(function Avatar({
    src,
    size,
    className,
    fallbackUrl: propsFallbackUrl,
    ...rest
}: AvatarProps) {
    const isDarkMode = useIsDarkMode();
    const defaultFallbackUrl = useDefaultFireflyAvatar();
    // number: next index of fallbacks to try.
    const [errorMap, setErrorMap] = useState<Record<string, number>>({});

    const url = [resolveAvatarFallbackUrl, resolveImgurUrl].reduce((acc, fn) => (acc ? fn(acc, isDarkMode) : acc), src);

    const fallbackUrl = propsFallbackUrl ?? defaultFallbackUrl;

    const isNormalUrl =
        !!src &&
        !src.startsWith('data:image/') &&
        !matchDomainSuffix(src, 'warpcast.com') &&
        !matchDomainSuffix(src, 'farcaster.xyz');

    const preferredSrc = (isNormalUrl ? url : src) || src || fallbackUrl;
    // Order: optimized preferred src -> preferred src -> optimized fallback -> fallback
    const fallbacks = useMemo(() => {
        const urls = [];

        const optimized = optimizeCDNImageSize(preferredSrc, size, size);
        if (optimized !== preferredSrc) urls.push(optimized);
        urls.push(preferredSrc);

        if (!urls.includes(fallbackUrl)) {
            const optimized = optimizeCDNImageSize(fallbackUrl, size, size);
            if (optimized !== fallbackUrl) urls.push(optimized);
            urls.push(fallbackUrl);
        }
        return urls;
    }, [fallbackUrl, preferredSrc, size]);
    // Start at the recorded error index, then skip past any fallback already known to
    // have failed globally — so remounts of a banned avatar never re-request it.
    let index = errorMap[preferredSrc] || 0;
    while (index < fallbacks.length - 1 && failedAvatarUrls.has(fallbacks[index])) {
        index += 1;
    }

    const imageSrc = fallbacks[index] || fallbackUrl;

    return (
        <NextImage
            {...rest}
            loading="lazy"
            unoptimized
            priority={false}
            className={classNames('max-w-none rounded-full bg-secondary object-cover', className)}
            style={{
                height: size,
                width: size,
                ...rest.style,
            }}
            src={imageSrc}
            width={size}
            height={size}
            alt={rest.alt}
            onError={() => {
                // Remember this URL is bad so it's never requested again, app-wide.
                failedAvatarUrls.add(imageSrc);
                setErrorMap((map) => {
                    const count = map[preferredSrc] || 0;
                    // Stop once all fallbacks are exhausted to avoid request storms (e.g. imgur 429s).
                    if (count >= fallbacks.length - 1) return map;
                    return { ...map, [preferredSrc]: count + 1 };
                });
            }}
        />
    );
});
