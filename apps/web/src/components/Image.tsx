'use client';

import { classNames } from '@dimensiondev/utils';
import type { ImageProps as NextImageProps } from 'next/image.js';
import { memo, type SyntheticEvent, useCallback, useEffect, useState } from 'react';

import { Image as NextImage } from '@/esm/Image.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
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
    fallback?: LiteralOrString<'avatar' | 'square' | 'rectangle'> | null;
    fallbackClassName?: string;
    ref?: React.ForwardedRef<HTMLImageElement>;
}

export const Image = memo(function Image({ onError, onLoad, fallback, fallbackClassName, ref, ...props }: ImageProps) {
    const [imageLoadFailed, setImageLoadFailed] = useState(false);
    const isDarkMode = useIsDarkMode();
    const [loading, setLoading] = useState(true);

    const handleError = useCallback(
        (e: SyntheticEvent<HTMLImageElement>) => {
            setLoading(false);
            if (imageLoadFailed) {
                return;
            }
            setImageLoadFailed(true);
            if (onError) {
                onError(e);
            }
        },
        [imageLoadFailed, setImageLoadFailed, onError],
    );

    const handleLoad = useCallback(
        (e: SyntheticEvent<HTMLImageElement>) => {
            setLoading(false);
            onLoad?.(e);
        },
        [onLoad],
    );

    useEffect(() => {
        setImageLoadFailed(!props.src);
    }, [props.src]);

    const isFailed = imageLoadFailed || !props.src;

    return (
        // Since next/image requires the domain of the image to be configured in next.config,
        // But we can't predict the origin of all images.

        <NextImage
            unoptimized
            loading={props.priority ? 'eager' : 'lazy'}
            priority={false}
            {...props}
            onLoad={handleLoad}
            src={isFailed ? resolveFallbackImageUrl(fallback || 'rectangle', isDarkMode) : props.src}
            className={classNames(
                props.className,
                isFailed ? fallbackClassName : undefined,
                loading ? 'bg-bg animate-pulse' : '',
            )}
            onError={handleError}
            alt={props.alt || ''}
            ref={ref}
        />
    );
});
