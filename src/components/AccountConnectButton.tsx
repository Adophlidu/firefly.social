import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import DoubleUser from '@/assets/double-user.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { classNames } from '@/helpers/classNames.js';
import { useAsyncStatusAll, useSyncingSources } from '@/hooks/useAsyncStatus.js';

interface Props {
    onClick: () => void;
}

export const AccountConnectButton = memo<Props>(function AccountConnectButton({ onClick }) {
    const syncingSources = useSyncingSources();
    const isLoading = useAsyncStatusAll();

    return (
        <ClickableButton
            disabled={isLoading}
            onClick={onClick}
            className={classNames(
                'flex h-10 min-w-[120px] items-center gap-3 whitespace-nowrap rounded-lg bg-lightBg px-4 text-lg leading-6 text-main',
            )}
        >
            {!syncingSources.length ? (
                <>
                    <DoubleUser />
                    <Trans>My Accounts</Trans>
                </>
            ) : (
                <>
                    <Trans>My Accounts</Trans>
                    {isLoading ? (
                        <LoadingIcon size={20} />
                    ) : (
                        <div className="flex items-center">
                            {syncingSources.map((source, index, self) => {
                                return (
                                    <ProfileSourceIcon
                                        key={index}
                                        source={source}
                                        className={index > 0 && self.length > 1 ? '-ml-2' : undefined}
                                        style={{ zIndex: self.length - index }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </ClickableButton>
    );
});
