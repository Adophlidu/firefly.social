'use client';

import SendIcon from '@dimensiondev/assets/send.svg';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { openComposeModal } from '@/controllers/openComposeModal.js';

interface PostWithLinkButtonProps {
    /** The original (long) link — composing keeps the canonical URL rather than a shortlink. */
    link: string;
    onClick?: () => void;
}

export const PostWithLinkButton = memo(function PostWithLinkButton({ link, onClick }: PostWithLinkButtonProps) {
    return (
        <MenuButton
            onClick={() => {
                openComposeModal({ chars: link });
                onClick?.();
            }}
        >
            <SendIcon width={18} height={18} />
            <span className="font-bold leading-[22px] text-main">
                <Trans>Post with link</Trans>
            </span>
        </MenuButton>
    );
});
