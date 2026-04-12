'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { first } from 'lodash-es';
import { type HTMLProps, memo, useCallback } from 'react';

import { ImageAsset } from '@/components/Posts/ImageAsset.js';
import { RemoveButton } from '@/components/RemoveButton.js';
import { IMAGE_KIT_ATTACHMENT } from '@/constants/static.js';
import { formatImageUrl } from '@/helpers/formatImageUrl.js';
import { resolveMediaObjectUrl } from '@/helpers/resolveMediaObjectUrl.js';
import { sanitizeDStorageUrl } from '@/helpers/sanitizeDStorageUrl.js';
import { ConfirmModalRef } from '@/modals/ConfirmModal/refs.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import type { MediaObject } from '@/types/compose.js';

const getClass = (size: number) => {
    if (size === 1) {
        return {
            aspect: 'aspect-w-16 aspect-h-10',
            row: 'grid-cols-1 grid-rows-1',
        };
    } else if (size >= 5) {
        return {
            aspect: 'aspect-square',
            row: 'grid-cols-3',
        };
    } else if (size === 2) {
        return {
            aspect: 'aspect-w-16 aspect-h-12',
            row: 'grid-cols-2 grid-rows-1',
        };
    } else if (size > 2) {
        return {
            aspect: 'aspect-w-16 aspect-h-12',
            row: 'grid-cols-2 grid-rows-2',
        };
    }
    return {
        aspect: '',
        row: '',
    };
};

interface ComposeImagesProps extends HTMLProps<HTMLDivElement> {
    images: MediaObject[];
    readonly?: boolean;
}

export const ComposeImages = memo(function ComposeImages({ images, readonly = false, ...rest }: ComposeImagesProps) {
    const { removeImage } = useComposeStateStore();
    const size = images.length;
    const moreImageCount = size - 9;
    const showSize = Math.min(size, 9);

    const handleRemoveImage = useCallback(
        async (image: MediaObject) => {
            if (image.isRpPayloadImage) {
                const confirmed = await ConfirmModalRef.openAndWaitForClose({
                    title: <Trans>Remove</Trans>,
                    content: (
                        <span className="text-secondary text-center text-[15px] leading-normal">
                            <Trans>
                                Confirm to remove this Lucky drop? You can request a refund from your history after 24
                                hours.
                            </Trans>
                        </span>
                    ),
                    enableCancelButton: true,
                    enableConfirmButton: true,
                    enableCloseButton: false,
                    variant: 'normal',
                });
                if (!confirmed) return;
            }
            removeImage(image);
        },
        [removeImage],
    );

    if (size === 1) {
        const target = first(images);
        if (!target) return null;
        return (
            <div {...rest} className={classNames('relative', rest.className)}>
                <ImageAsset
                    className="w-full cursor-pointer rounded-lg object-cover"
                    width={1000}
                    height={1000}
                    src={sanitizeDStorageUrl(resolveMediaObjectUrl(target))}
                    alt={target.file.name}
                    overSize={!target.isRpPayloadImage}
                />
                {!readonly ? (
                    <RemoveButton className="absolute right-1 top-1 z-10" onClick={() => handleRemoveImage(target)} />
                ) : null}
            </div>
        );
    }

    return (
        <div {...rest} className={classNames('grid gap-2', getClass(showSize).row, rest.className)}>
            {images.map((image, index, list) => {
                const uri = sanitizeDStorageUrl(resolveMediaObjectUrl(image));
                const isLast = list.length === index;
                return (
                    <div
                        key={image.id}
                        className={classNames('relative flex items-center justify-center', getClass(showSize).aspect, {
                            'max-h-[288px]': size === 2 || showSize === 4,
                            'row-span-2 max-h-[288px]': size === 3 && index === 1,
                            'max-h-[138px]': size === 3 && index !== 1,
                            relative: isLast && moreImageCount > 0,
                        })}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="size-full shrink-0 cursor-pointer rounded-lg object-cover"
                            loading="lazy"
                            src={formatImageUrl(uri, IMAGE_KIT_ATTACHMENT)}
                            alt={formatImageUrl(uri, IMAGE_KIT_ATTACHMENT)}
                        />
                        {isLast && moreImageCount > 0 ? (
                            <div className="bg-mainLight/50 absolute right-0 top-0 flex size-full items-center justify-center rounded-lg text-white">
                                <div className={'text-2xl font-bold'}>+{moreImageCount + 1}</div>
                            </div>
                        ) : null}
                        {!readonly ? (
                            <RemoveButton
                                className="absolute right-1 top-1 z-10"
                                onClick={() => handleRemoveImage(image)}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
});
