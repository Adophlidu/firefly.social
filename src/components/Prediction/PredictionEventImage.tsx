'use client';

import { classNames } from '@dimensiondev/utils';
import { memo, type SyntheticEvent, useCallback, useState } from 'react';

import FireflyMonochromeIcon from '@/assets/firefly-monochrome.svg';
import { Image, type ImageProps } from '@/components/Image.js';
import { PredictionPlatform } from '@/constants/enum.js';

interface PredictionEventImageProps extends ImageProps {
    platform: PredictionPlatform;
    width: number;
    height: number;
}

const platformDefaultImages: Record<PredictionPlatform, string | null> = {
    [PredictionPlatform.Polymarket]: null,
    [PredictionPlatform.Opinion]: null,
};

export const PredictionEventImage = memo<PredictionEventImageProps>(function PredictionEventImage({
    platform,
    className,
    width,
    height,
    onError,
    ...rest
}) {
    const [useFireflyFallback, setUseFireflyFallback] = useState(false);

    const fallbackImageUrl = platformDefaultImages[platform];
    const handleError = useCallback(
        (e: SyntheticEvent<HTMLImageElement>) => {
            onError?.(e);
            if (!fallbackImageUrl) {
                setUseFireflyFallback(true);
            }
        },
        [fallbackImageUrl, onError],
    );

    if (useFireflyFallback) {
        return (
            <div
                className={classNames('flex items-center justify-center rounded-lg bg-[#f2f2f2]', className)}
                style={{
                    width,
                    height,
                }}
            >
                <FireflyMonochromeIcon className="text-[#bdbdbd]" width={width / 2} height={height / 2} />
            </div>
        );
    }

    return (
        <div
            className={classNames('relative overflow-hidden rounded-lg', className)}
            style={{
                width,
                height,
            }}
        >
            <Image
                unoptimized={false}
                {...rest}
                fill
                quality={75}
                className="object-cover"
                fallback={fallbackImageUrl}
                sizes="(max-width: 768px) 15vw, (max-width: 1400px) 10vw, 90px"
                onError={handleError}
            />
        </div>
    );
});
