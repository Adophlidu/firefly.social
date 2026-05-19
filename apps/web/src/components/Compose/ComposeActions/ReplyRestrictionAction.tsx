import { ENABLED_REPLY_SETTINGS_POST_SOURCES } from '@dimensiondev/constants/computed';
import { RestrictionType } from '@dimensiondev/enums';
import { Popover, PopoverButton } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { ReplyRestriction } from '@/components/Compose/ReplyRestriction.js';
import { ReplyRestrictionText } from '@/components/Compose/ReplyRestrictionText.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
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
            {!disabled ? <ChevronDownIcon className="text-secondary size-4" aria-hidden="true" /> : null}
        </>
    );

    if (disabled && restriction === RestrictionType.Everyone) return null;
    if (disabled)
        return (
            <div className="border-secondaryLine text-main flex gap-1 text-nowrap rounded-[6px] border p-2 focus:outline-none">
                {buttonContent}
            </div>
        );

    if (isMedium) {
        return (
            <Popover as="div" className="border-secondaryLine relative text-nowrap rounded-[6px] border p-2">
                <PopoverButton
                    className="text-main flex cursor-pointer items-center gap-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={hasError}
                >
                    {buttonContent}
                </PopoverButton>
                <ReplyRestriction restriction={restriction} setRestriction={updateRestriction} />
            </Popover>
        );
    }
    return (
        <div className="border-secondaryLine text-nowrap rounded-[6px] border p-2">
            <ClickableButton
                className="text-main flex cursor-pointer gap-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
