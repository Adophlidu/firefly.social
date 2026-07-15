'use client';

import { classNames } from '@dimensiondev/utils';
import { Bars3Icon, ChevronDoubleLeftIcon } from '@heroicons/react/24/outline';
import { t } from '@lingui/core/macro';
import { memo } from 'react';

import { Tooltip } from '@/components/Tooltip.js';

interface ConversationListToggleProps {
    className?: string;
    isCollapsed: boolean;
    onToggle: () => void;
}

export const ConversationListToggle = memo(function ConversationListToggle({
    className,
    isCollapsed,
    onToggle,
}: ConversationListToggleProps) {
    const label = isCollapsed ? t`Show conversations` : t`Hide conversations`;

    return (
        <Tooltip content={label} placement="bottom">
            <button
                type="button"
                className={classNames(
                    'hidden size-9 shrink-0 place-items-center rounded-xl border border-line bg-lightBg text-second shadow-sm transition-colors hover:bg-primaryBottom hover:text-main md:grid',
                    className,
                )}
                aria-controls="dm-conversation-list"
                aria-expanded={!isCollapsed}
                aria-label={label}
                onClick={onToggle}
            >
                {isCollapsed ? <Bars3Icon width={18} height={18} /> : <ChevronDoubleLeftIcon width={17} height={17} />}
            </button>
        </Tooltip>
    );
});
