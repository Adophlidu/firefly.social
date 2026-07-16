'use client';

import LinkIcon from '@dimensiondev/assets/small-link.svg';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, useState } from 'react';
import urlcat from 'urlcat';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useCopyText } from '@/hooks/useCopyText.js';

interface CopyLinkButtonProps extends Omit<HTMLProps<HTMLButtonElement>, 'onClick'> {
    /** Resolves the link to copy — called (and awaited) only when this button is clicked. */
    getLink: () => string | Promise<string>;
    onClick?: () => void;
}

/**
 * Resolves its link lazily on click rather than upfront, so opening the share menu never triggers
 * network work or a loading state — only clicking this specific item does, and only this item shows
 * the spinner while it's in flight.
 */
export const CopyLinkButton = memo(function CopyLinkButton({ getLink, children, ref, onClick }: CopyLinkButtonProps) {
    const [pending, setPending] = useState(false);
    const [, handleCopy] = useCopyText('');

    return (
        <MenuButton
            ref={ref}
            disabled={pending}
            onClick={async (event) => {
                // Keep the menu open while resolving — headless-ui closes it on click by default,
                // which would unmount this button (and its spinner) before the copy even lands.
                event.preventDefault();
                setPending(true);
                try {
                    const link = await getLink();
                    const url = link.startsWith('http') ? link : urlcat(location.origin, link);
                    handleCopy(url);
                    onClick?.();
                } finally {
                    setPending(false);
                }
            }}
        >
            {pending ? <LoadingIcon size={18} /> : <LinkIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">{children || <Trans>Copy link</Trans>}</span>
        </MenuButton>
    );
});
