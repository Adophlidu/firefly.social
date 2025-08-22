import { Popover } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';

import GalleryIcon from '@/assets/gallery.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Media } from '@/components/Compose/Media.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { Tooltip } from '@/components/Tooltip.js';
import { FileMimeType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import {
    getCurrentPostGifLimits,
    getCurrentPostImageLimits,
    getCurrentPostVideoLimits,
} from '@/helpers/getCurrentPostImageLimits.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export const MediaAction = memo(function MediaAction() {
    const isMedium = useIsMedium();
    const post = useCompositePost();
    const { type } = useComposeStateStore();
    const [open, setOpen] = useState(false);

    const { availableSources, images, videos, poll, rpPayload } = post;
    const maxGifCount = getCurrentPostGifLimits(availableSources);
    const maxImageCount = getCurrentPostImageLimits(type, availableSources);
    const maxVideoCount = getCurrentPostVideoLimits(availableSources);
    const mediaDisabled =
        !!rpPayload ||
        !!poll ||
        videos.length > maxVideoCount ||
        images.length >= maxImageCount ||
        images.filter((x) => x.file.type === FileMimeType.GIF).length >= maxGifCount;

    const buttonContent = (
        <Tooltip content={<Trans>Media</Trans>} placement="top" disabled={mediaDisabled}>
            <GalleryIcon
                className={classNames('text-main', mediaDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
                width={24}
                height={24}
            />
        </Tooltip>
    );
    if (isMedium)
        return (
            <Popover as="div" className="relative">
                {({ close }) => (
                    <>
                        <Popover.Button className="flex cursor-pointer gap-1 text-main focus:outline-none">
                            {buttonContent}
                        </Popover.Button>

                        {!mediaDisabled ? <Media close={close} /> : null}
                    </>
                )}
            </Popover>
        );
    return (
        <>
            <ClickableButton onClick={() => setOpen(true)}>{buttonContent}</ClickableButton>
            <PopoverModal open={open} onClose={() => setOpen(false)}>
                {!mediaDisabled ? <Media close={() => setOpen(false)} /> : null}
            </PopoverModal>
        </>
    );
});
