import FallbackDarkImage from '@dimensiondev/assets/img-fallback-dark.png';
import FallbackLightImage from '@dimensiondev/assets/img-fallback-light.png';
import { type ComponentPropsWithRef, memo, type SyntheticEvent, useCallback, useEffect, useState } from 'react';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { cn } from '@/lib/utils.js';

export interface ImageProps extends Omit<ComponentPropsWithRef<'img'>, 'src'> {
    src?: string | null;
    fallback?: string | null;
    fallbackClassName?: string;
    priority?: boolean;
    unoptimized?: boolean;
    fill?: boolean;
}

export const Image = memo(function Image({
    onError,
    onLoad,
    fallback,
    fallbackClassName,
    ref,
    priority,
    unoptimized,
    fill,
    style,
    ...props
}: ImageProps) {
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
    const fallbackSrc = fallback || (isDarkMode ? FallbackDarkImage : FallbackLightImage);
    const imageSrc = isFailed ? fallbackSrc : props.src;

    // Handle fill prop (similar to Next.js Image fill behavior)
    const fillStyle = fill
        ? {
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover' as const,
              ...style,
          }
        : style;

    return (
        <img
            loading={priority ? 'eager' : 'lazy'}
            {...props}
            onLoad={handleLoad}
            src={imageSrc as string}
            className={cn(
                props.className,
                isFailed ? fallbackClassName : undefined,
                loading ? 'bg-bg animate-pulse' : '',
            )}
            onError={handleError}
            alt={props.alt || ''}
            ref={ref}
            style={fillStyle}
        />
    );
});
