/* eslint-disable @next/next/no-img-element */
import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { computeSize } from '@/helpers/computeSize.js';
import { optimizeCDNImageSize } from '@/helpers/optimizeCDNImageSize.js';
import { useResourceFallback } from '@/hooks/useResourceFallback.js';

interface SingleImageProps extends HTMLProps<HTMLImageElement> {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    width: number;
    height: number;
}

export const SingleImage = memo<SingleImageProps>(function SingleImage({
    src,
    width,
    height,
    minWidth = 50,
    maxWidth = 550,
    minHeight = 50,
    maxHeight = 450,
    children,
    ...props
}) {
    const optimizedSrc = src ? optimizeCDNImageSize(src, maxWidth, maxHeight) : undefined;
    // Try the optimized URL, then the raw src; skips flooding/known-bad hosts.
    const resource = useResourceFallback([optimizedSrc, src]);
    const finalSrc = resource.src;

    const { data } = useQuery({
        queryKey: ['single-image', finalSrc],
        staleTime: STALE_TIMES.INFINITY,
        enabled: !!finalSrc,
        retry: false,
        queryFn: () =>
            new Promise<{ width: number; height: number }>((resolve, reject) => {
                const image = new Image();

                image.onload = () =>
                    resolve({
                        width: image.naturalWidth || image.width,
                        height: image.naturalHeight || image.height,
                    });
                image.onerror = () => reject(new Error('Failed to load image'));
                image.onabort = () => reject(new Error('Image load aborted'));

                image.src = finalSrc!;
            }),
    });

    if (resource.failed) return null;

    const imageWidth = data?.width || width;
    const imageHeight = data?.height || height;
    const [renderWidth] = computeSize(imageWidth || width, imageHeight || height, {
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
    });

    return (
        <div
            className="relative max-w-full rounded-lg bg-bg"
            style={{
                aspectRatio: `${imageWidth}/${imageHeight}`,
                width: renderWidth,
            }}
        >
            {children}
            <div className="absolute inset-0">
                <img
                    {...props}
                    src={finalSrc}
                    onLoad={(event) => {
                        props.onLoad?.(event);
                        resource.onLoad();
                    }}
                    onError={(event) => {
                        props.onError?.(event);
                        resource.onError();
                    }}
                    className={classNames('size-full', props.className)}
                    alt={props.alt || ''}
                />
            </div>
        </div>
    );
});
