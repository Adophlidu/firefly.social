'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { useJoinClub } from '@/hooks/useJoinClub.js';

interface JoinClubLinkProps {
    clubAddress?: string;
    className?: string;
}

/**
 * Inline "Join now" affordance for club-gated (Lens group) posts. Joins the
 * club in place so the user can reply/repost without leaving the page (FW-7785).
 */
export const JoinClubLink = memo<JoinClubLinkProps>(function JoinClubLink({ clubAddress, className }) {
    const [{ loading }, joinClub] = useJoinClub(clubAddress);

    return (
        <ClickableButton
            disabled={loading}
            className={classNames('cursor-pointer underline disabled:opacity-50', className)}
            onClick={() => joinClub()}
        >
            <Trans>Join now</Trans>
        </ClickableButton>
    );
});
