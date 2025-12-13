import { Popover, PopoverButton } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PostBy } from '@/components/Compose/PostBy.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { SORTED_SOCIAL_SOURCES, SUPPORTED_ANONYMOUS_POST_SOURCES } from '@/constants/computed.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { postFeatures } from '@/settings/post.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface ActionProps {
    hasError: boolean;
}

export const PlatformAction = memo(function PlatformAction({ hasError }: ActionProps) {
    const { availableSources, parentPost, isAnonymous } = useCompositePost();
    const { type, sealedSource } = useComposeStateStore();
    const profilesAll = useCurrentProfilesAll();

    const [open, setOpen] = useState(false);
    const isMedium = useIsMedium();

    const disabled =
        (type !== 'quote' &&
            (sealedSource && postFeatures.anonymousPost(sealedSource) ? type !== 'reply' : true) &&
            availableSources.some((x) => !!parentPost[x])) ||
        hasError;

    const buttonContent = (
        <>
            <div className="text-nowrap text-[14px] leading-[18px] text-main">
                <Trans>Share to</Trans>
            </div>
            <span className="flex items-center gap-x-1 font-bold">
                {availableSources
                    .filter(
                        (x) =>
                            (!!profilesAll[x] || (isAnonymous && SUPPORTED_ANONYMOUS_POST_SOURCES.includes(x))) &&
                            SORTED_SOCIAL_SOURCES.includes(x),
                    )
                    .map((y) => (
                        <SocialSourceIcon key={y} source={y} size={14} />
                    ))}
            </span>
            {!disabled ? <ChevronDownIcon className="size-4 text-secondary" aria-hidden="true" /> : null}
        </>
    );

    if (isMedium)
        return (
            <Popover as="div" className="relative">
                <PopoverButton
                    className="flex cursor-pointer items-center gap-1 text-main focus:outline-none disabled:cursor-default"
                    disabled={disabled}
                >
                    {buttonContent}
                </PopoverButton>
                <PostBy />
            </Popover>
        );

    return (
        <>
            <ClickableButton
                className="flex items-center gap-1 text-main focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
                disabled={disabled}
            >
                {buttonContent}
            </ClickableButton>
            <PopoverModal open={open} onClose={() => setOpen(false)}>
                <PostBy />
            </PopoverModal>
        </>
    );
});
