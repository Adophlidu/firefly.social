import { PopoverPanel, Transition } from '@headlessui/react';
import { Fragment } from 'react';

import { CircleCheckboxIcon } from '@/components/CircleCheckboxIcon.js';
import { ReplyRestrictionText } from '@/components/Compose/ReplyRestrictionText.js';
import type { RestrictionType } from '@/constants/enum.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useValidRestrictionTypes } from '@/hooks/useValidRestrictionTypes.js';
import { captureReplyRestrictionChangeClickEvent } from '@/providers/telemetry/captureClickEvent.js';

interface ReplyRestrictionProps {
    restriction: RestrictionType;
    setRestriction: (restriction: RestrictionType) => void;
}

export function ReplyRestriction({ restriction, setRestriction }: ReplyRestrictionProps) {
    const { availableSources } = useCompositePost();
    const items = useValidRestrictionTypes(availableSources);

    const isMedium = useIsMedium();

    const content = (
        <div className="md:bg-lightBottom md:dark:bg-darkBottom flex flex-col rounded-lg">
            {items.map((type) => (
                <div
                    key={type}
                    className="hover:bg-bg flex h-12 cursor-pointer items-center justify-between px-3"
                    onClick={() => {
                        setRestriction(type);
                        captureReplyRestrictionChangeClickEvent();
                    }}
                >
                    <span className="text-main mr-auto font-bold">
                        <ReplyRestrictionText type={type} />
                    </span>
                    <CircleCheckboxIcon checked={restriction === type} />
                </div>
            ))}
        </div>
    );

    if (isMedium)
        return (
            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0 translate-y-1"
            >
                <PopoverPanel
                    portal
                    modal
                    anchor="top"
                    className="no-scrollbar bg-lightBottom text-medium shadow-popover dark:border-line dark:bg-darkBottom absolute bottom-full right-0 z-10 w-[320px] -translate-y-3 overflow-hidden rounded-lg dark:border dark:shadow-none"
                    style={
                        {
                            '--anchor-max-height': `${items.length <= 4 ? items.length * 48 : 216}px`,
                        } as React.CSSProperties
                    }
                >
                    {content}
                </PopoverPanel>
            </Transition>
        );

    return content;
}
