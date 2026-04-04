/* eslint-disable @next/next/no-img-element */
import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { STALE_TIMES } from '@/constants/query.js';
import { computeSize } from '@/helpers/computeSize.js';

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
    ...props
}) {
    const { data, error } = useQuery({
        queryKey: ['single-image', src],
        staleTime: STALE_TIMES.INFINITY,
        enabled: !!src,
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

                image.src = src!;
            }),
    });

    if (error) return null;

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
            className="bg-bg relative max-w-full rounded-lg"
            style={{
                aspectRatio: `${imageWidth}/${imageHeight}`,
                width: renderWidth,
            }}
        >
            <div className="absolute inset-0">
                <img src={src} {...props} className={classNames('size-full', props.className)} alt={props.alt || ''} />
            </div>
        </div>
    );
});
