'use client';

import LinkIcon from '@dimensiondev/assets/small-link.svg';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo } from 'react';
import urlcat from 'urlcat';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface CopyLinkButtonProps extends HTMLProps<HTMLButtonElement> {
    link: string;
    onClick?: () => void;
    /** True while the link is still being created on the server — disables copying the stale fallback. */
    pending?: boolean;
}

export const CopyLinkButton = memo(function CopyLinkButton({
    link,
    children,
    ref,
    onClick,
    pending,
}: CopyLinkButtonProps) {
    const url = link.startsWith('http') ? link : urlcat(location.origin, link);
    const [, handleCopy] = useCopyText(url);

    return (
        <MenuButton
            ref={ref}
            disabled={pending}
            onClick={() => {
                handleCopy();
                onClick?.();
            }}
        >
            {pending ? <LoadingIcon width={18} height={18} /> : <LinkIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">{children || <Trans>Copy link</Trans>}</span>
        </MenuButton>
    );
});
