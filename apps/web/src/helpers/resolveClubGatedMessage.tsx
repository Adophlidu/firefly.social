import { Trans } from '@lingui/react/macro';

import { JoinClubLink } from '@/components/JoinClubLink.js';

/**
 * Shared copy for a Lens club (group) gate — used both when a reply/repost is
 * blocked ahead of time and when a compose send fails because the author
 * hasn't joined the required club (FW-7874).
 */
export function resolveClubGatedMessage(clubAddress: string) {
    return (
        <>
            <Trans>Only club members can reply to this post.</Trans> <JoinClubLink clubAddress={clubAddress} />
        </>
    );
}
