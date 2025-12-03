import { Popover, PopoverButton } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ReplyRestriction } from '@/components/Compose/ReplyRestriction.js';
import { ReplyRestrictionText } from '@/components/Compose/ReplyRestrictionText.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { RestrictionType } from '@/constants/enum.js';
import { ENABLED_REPLY_SETTINGS_POST_SOURCES } from '@/constants/index.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useValidRestrictionTypes } from '@/hooks/useValidRestrictionTypes.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface ActionProps {
    hasError: boolean;
}

export const ReplyRestrictionAction = memo(function ReplyRestrictionAction({ hasError }: ActionProps) {
    const isMedium = useIsMedium();

    const { restriction, availableSources } = useCompositePost();
    const { updateRestriction } = useComposeStateStore();
    const validTypes = useValidRestrictionTypes(availableSources);

    const disabled =
        hasError ||
        !validTypes.length ||
        (validTypes.length === 1 && validTypes[0] === RestrictionType.Everyone) ||
        availableSources.some((x) => !ENABLED_REPLY_SETTINGS_POST_SOURCES.includes(x));
    const [open, setOpen] = useState(false);

    const buttonContent = (
        <>
            <span className="text-[14px] leading-[18px]">
                <ReplyRestrictionText type={restriction} />
            </span>
            {!disabled ? <ChevronDownIcon className="size-4 text-secondary" aria-hidden="true" /> : null}
        </>
    );

    if (disabled && restriction === RestrictionType.Everyone) return null;
    if (disabled)
        return (
            <div className="flex gap-1 text-nowrap rounded-[6px] border border-secondaryLine p-2 text-main focus:outline-none">
                {buttonContent}
            </div>
        );

    if (isMedium) {
        return (
            <Popover as="div" className="relative text-nowrap rounded-[6px] border border-secondaryLine p-2">
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
        <div className="text-nowrap rounded-[6px] border border-secondaryLine p-2">
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
        </div>
    );
});
