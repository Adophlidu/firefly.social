import { Popover, PopoverButton } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ReplyRestriction } from '@/components/Compose/ReplyRestriction.js';
import { ReplyRestrictionText } from '@/components/Compose/ReplyRestrictionText.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { ENABLED_REPLY_SETTINGS_POST_SOURCES } from '@/constants/index.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface ActionProps {
    hasError: boolean;
}
export const ReplyRestrictionAction = memo(function ReplyRestrictionAction({ hasError }: ActionProps) {
    const isMedium = useIsMedium();

    const post = useCompositePost();
    const { updateRestriction } = useComposeStateStore();
    const { restriction, availableSources } = post;

    const disabled =
        hasError ||
        availableSources.length > 1 ||
        availableSources.some((x) => !ENABLED_REPLY_SETTINGS_POST_SOURCES.includes(x));
    const [open, setOpen] = useState(false);

    const buttonContent = (
        <>
            <span className="text-[14px] leading-[18px]">
                <ReplyRestrictionText type={restriction} />
            </span>
            {!disabled ? <ChevronDownIcon className="h-4 w-4 text-secondary" aria-hidden="true" /> : null}
        </>
    );

    if (disabled) return <div className="flex gap-1 text-main focus:outline-none">{buttonContent}</div>;

    if (isMedium) {
        return (
            <Popover as="div" className="relative">
                <PopoverButton
                    className="flex cursor-pointer items-center gap-1 text-main focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={hasError}
                >
                    {buttonContent}
                </PopoverButton>
                <ReplyRestriction restriction={restriction} setRestriction={updateRestriction} />
            </Popover>
        );
    }
    return (
        <>
            <ClickableButton
                className="flex cursor-pointer gap-1 text-main focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
                disabled={disabled}
            >
                {buttonContent}
            </ClickableButton>
            <PopoverModal open={open} onClose={() => setOpen(false)}>
                <ReplyRestriction restriction={restriction} setRestriction={updateRestriction} />
            </PopoverModal>
        </>
    );
});
