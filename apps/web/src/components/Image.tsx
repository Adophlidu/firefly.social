'use client';

import { classNames } from '@dimensiondev/utils';
import type { ImageProps as NextImageProps } from 'next/image.js';
import { memo, type SyntheticEvent } from 'react';

import { Image as NextImage } from '@/esm/Image.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useResourceFallback } from '@/hooks/useResourceFallback.js';
import type { LiteralOrString } from '@/types/utility.js';

const resolveFallbackImageUrl = (fallback: LiteralOrString<'avatar' | 'square' | 'rectangle'>, isDarkMode: boolean) => {
    if (fallback === 'avatar') {
        return isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
    }
    if (fallback === 'square') {
        return isDarkMode ? '/image/img-fallback-dark.png' : '/image/img-fallback-light.png';
    }
    if (fallback === 'rectangle') {
        return isDarkMode ? '/image/fallback-dark.png' : '/image/fallback-light.png';
    }
    return fallback as string;
};

export interface ImageProps extends NextImageProps {
    // Pass `false` to render nothing when the image fails to load instead of a placeholder.
    fallback?: LiteralOrString<'avatar' | 'square' | 'rectangle'> | null | false;
    fallbackClassName?: string;
    ref?: React.ForwardedRef<HTMLImageElement>;
}

export const Image = memo(function Image({ onError, onLoad, fallback, fallbackClassName, ref, ...props }: ImageProps) {
    const isDarkMode = useIsDarkMode();

    // Static imports (non-string src) are bundled assets — bypass the URL fallback chain.
    const isStatic = !!props.src && typeof props.src !== 'string';
    const srcUrl = typeof props.src === 'string' ? props.src : undefined;
    const fallbackUrl = fallback === false ? undefined : resolveFallbackImageUrl(fallback || 'rectangle', isDarkMode);

    const resource = useResourceFallback(isStatic ? [] : [srcUrl, fallbackUrl]);

    const isFailed = isStatic ? false : resource.failed || !props.src;
    if (isFailed && fallback === false) return null;

    const displaySrc = isStatic ? props.src : (resource.src ?? fallbackUrl);
    if (!displaySrc) return null;

    return (
        // Since next/image requires the domain of the image to be configured in next.config,
        // But we can't predict the origin of all images.

        <NextImage
            unoptimized
            loading={props.priority ? 'eager' : 'lazy'}
            priority={false}
            {...props}
            src={displaySrc}
            onLoad={(e: SyntheticEvent<HTMLImageElement>) => {
                resource.onLoad();
                onLoad?.(e);
            }}
            onError={(e: SyntheticEvent<HTMLImageElement>) => {
                resource.onError();
                onError?.(e);
            }}
            className={classNames(
                props.className,
                isFailed ? fallbackClassName : undefined,
                resource.loading ? 'animate-pulse bg-bg' : '',
            )}
            alt={props.alt || ''}
            ref={ref}
        />
    );
});
