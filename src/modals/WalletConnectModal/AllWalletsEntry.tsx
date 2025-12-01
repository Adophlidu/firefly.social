import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';

export const AllWalletsEntry = memo(function AllWalletsEntry() {
    const { history } = useRouter();

    return (
        <ClickableButton
            className="w-full rounded-lg border border-secondaryLine p-2 text-sm leading-6 text-main"
            onClick={() => {
                history.push('/all-wallets');
            }}
        >
            <Trans>All Wallets</Trans>
        </ClickableButton>
    );
});
