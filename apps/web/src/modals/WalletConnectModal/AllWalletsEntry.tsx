import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';

export const AllWalletsEntry = memo(function AllWalletsEntry() {
    const { history } = useRouter();

    return (
        <ClickableButton
            className="border-secondaryLine text-main w-full rounded-lg border p-2 text-sm leading-6"
            onClick={() => {
                history.push('/all-wallets');
            }}
        >
            <Trans>All Wallets</Trans>
        </ClickableButton>
    );
});
