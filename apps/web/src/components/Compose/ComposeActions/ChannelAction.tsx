import type { SocialSource } from '@dimensiondev/enums';
import { Popover, PopoverButton } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ChannelSearchPanel } from '@/components/Compose/ChannelSearchPanel.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { resolveChannelName } from '@/helpers/resolveChannelName.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';

interface ActionProps {
    hasError: boolean;
    source: SocialSource;
}

export const ChooseChannelAction = memo(function ChooseChannelAction({ hasError, source }: ActionProps) {
    const isMedium = useIsMedium();
    const { channel } = useCompositePost();
    const [open, setOpen] = useState(false);

    const buttonContent = (
        <>
            <SocialSourceIcon className="text-secondary size-4" mono width={20} height={20} source={source} />

            <span className="text-[14px] leading-[18px]">
                {channel[source] ? resolveChannelName(channel[source]) : null}
            </span>
            {!hasError ? <ChevronDownIcon className="text-secondary size-4" aria-hidden="true" /> : null}
        </>
    );

    if (isMedium)
        return (
            <Popover as="div" className="relative">
                {({ close }) => (
                    <>
                        <PopoverButton
                            className="text-main flex cursor-pointer items-center gap-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={hasError}
                        >
                            {buttonContent}
                        </PopoverButton>
                        <ChannelSearchPanel source={source} onSelected={close} className="md:max-h-[192px]" />
                    </>
                )}
            </Popover>
        );

    return (
        <>
            <ClickableButton
                className="text-main flex items-center gap-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
            >
                {buttonContent}
            </ClickableButton>
            <PopoverModal open={open} onClose={() => setOpen(false)}>
                <ChannelSearchPanel source={source} onSelected={() => setOpen(false)} className="md:max-h-[192px]" />
            </PopoverModal>
        </>
    );
});
