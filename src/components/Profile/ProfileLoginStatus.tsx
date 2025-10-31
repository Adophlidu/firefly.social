import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps } from 'react';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { useProfileStore } from '@/hooks/useProfileStore.js';
import type { Account } from '@/providers/types/Account.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { switchAccount } from '@/services/account.js';

interface ProfileLoginStatusProps extends HTMLProps<HTMLDivElement> {
    profile: Profile;
}

function getButtonClassName(...rest: string[]) {
    return classNames('h-8 rounded-lg px-5 text-medium font-bold leading-[30px]', ...rest);
}

export function ProfileLoginStatus({ profile, className = '' }: ProfileLoginStatusProps) {
    const { accounts, currentProfile } = useProfileStore(profile.source);
    const [{ loading }, handleSwitch] = useAsyncFn(async (account: Account) => {
        try {
            await switchAccount(account);
        } catch (error) {
            enqueueMessageFromError(error, <Trans>Failed to switch.</Trans>);
            throw error;
        }
    }, []);

    // current active profile
    if (isSameProfile(profile, currentProfile)) return null;

    const relatedAccount = accounts.find((account) => isSameProfile(account.profile, profile));

    // has other accounts connected
    if (relatedAccount) {
        return (
            <ClickableButton
                loading={loading}
                onlyLoading
                className={getButtonClassName(className)}
                onClick={async () => {
                    await handleSwitch(relatedAccount);
                }}
            >
                <Trans>Switch</Trans>
            </ClickableButton>
        );
    }

    // try login new account
    return (
        <ClickableButton
            className={getButtonClassName(className)}
            onClick={() =>
                openLoginModal({
                    source: profile.source,
                    options: {
                        expectedProfile: profile.profileId,
                    },
                })
            }
        >
            <Trans>Reauthorize</Trans>
        </ClickableButton>
    );
}
