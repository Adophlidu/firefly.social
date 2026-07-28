'use client';

import { classNames } from '@dimensiondev/utils';
import type { ImageProps } from '@/esm/Image.js';
import { memo, useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Image } from '@/esm/Image.js';

interface ImageWithLoadingProps extends ImageProps {
    wrapperClassName?: string;
}

export const ImageWithLoading = memo<ImageWithLoadingProps>(function ImageWithLoading({
    wrapperClassName,
    className,
    src,
    alt,
    ...rest
}) {
    const [loading, setLoading] = useState(true);

    useUpdateEffect(() => {
        setLoading(true);
    }, [src]);

    return (
        <div className={classNames('relative overflow-hidden', wrapperClassName)}>
            <Image
                unoptimized
                alt={alt || 'Firefly'}
                src={src}
                {...rest}
                className={classNames('size-full', className)}
                onLoadStart={() => setLoading(true)}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
            />
            {loading ? (
                <div className="absolute inset-0 z-1 flex items-center justify-center rounded-full bg-white/70">
                    <LoadingIcon />
                </div>
            ) : null}
        </div>
    );
});
