import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo } from 'react';

import DoubleUser from '@/assets/double-user.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { classNames } from '@/helpers/classNames.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfileAll } from '@/hooks/useCurrentProfile.js';

interface Props {
    onClick: () => void;
}

export const AccountConnectButton = memo<Props>(function AccountConnectButton({ onClick }) {
    const all = useCurrentProfileAll();
    const allProfiles = compact(SORTED_SOCIAL_SOURCES.map((x) => all[x]));
    const isLoading = useAsyncStatusAll();

    return (
        <ClickableButton
            disabled={isLoading}
            onClick={onClick}
            className={classNames(
                'ml-6 flex h-10 min-w-[120px] items-center gap-3 rounded-lg bg-lightBg px-4 text-lg leading-6 text-main',
            )}
        >
            {!allProfiles.length ? (
                <>
                    <DoubleUser />
                    <Trans>My Accounts</Trans>
                </>
            ) : (
                <>
                    <Trans>My Accounts</Trans>
                    <div className="flex items-center">
                        {allProfiles.map((profile, index, self) => {
                            return (
                                <ProfileSourceIcon
                                    key={index}
                                    source={profile.source}
                                    className={index > 0 && self.length > 1 ? '-ml-1' : undefined}
                                    style={{ zIndex: self.length - index }}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </ClickableButton>
    );
});
