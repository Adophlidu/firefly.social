'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import { Trans } from '@lingui/react/macro';
import { memo, useState } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';

interface PostWithLinkButtonProps {
    /** Resolves the link to post — called (and awaited) only when this button is clicked. */
    getLink: () => string | Promise<string>;
    onClick?: () => void;
}

/**
 * Resolves its link lazily on click rather than upfront, so opening the share menu never triggers
 * network work or a loading state — only clicking this specific item does, and only this item shows
 * the spinner while it's in flight.
 */
export const PostWithLinkButton = memo(function PostWithLinkButton({ getLink, onClick }: PostWithLinkButtonProps) {
    const [pending, setPending] = useState(false);

    return (
        <MenuButton
            disabled={pending}
            onClick={async (event) => {
                // Keep the menu open while resolving — headless-ui closes it on click by default,
                // which would unmount this button (and its spinner) before the compose modal opens.
                event.preventDefault();
                setPending(true);
                try {
                    const link = await getLink();
                    openComposeModal({ chars: link });
                    onClick?.();
                } finally {
                    setPending(false);
                }
            }}
        >
            {pending ? <LoadingIcon size={18} /> : <SendIcon width={18} height={18} />}
            <span className="font-bold leading-[22px] text-main">
                <Trans>Post with link</Trans>
            </span>
        </MenuButton>
    );
});
