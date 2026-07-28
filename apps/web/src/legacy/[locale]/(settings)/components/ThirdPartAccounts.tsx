'use client';

import AppleIcon from '@dimensiondev/assets/apple-small.svg';
import EmailIcon from '@dimensiondev/assets/email.svg';
import GoogleIcon from '@dimensiondev/assets/google-small.svg';
import TelegramIcon from '@dimensiondev/assets/telegram.svg';
import type { ThirdPartySource } from '@dimensiondev/enums';
import { Source, SourceInURL } from '@dimensiondev/enums';
import { classNames, runInSafeAsync } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type FunctionComponent, type SVGAttributes, useMemo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatAccountFromConnections } from '@/helpers/formatAccountFromConnections.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { ThirdPartConnectButton } from '@/legacy/[locale]/(settings)/components/ThirdPartConnectButton.js';
import { ThirdPartDisconnectButton } from '@/legacy/[locale]/(settings)/components/ThirdPartDisconnectButton.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';
import { formatThirdPartyProfileName } from '@/providers/lens/formatThirdPartyProfileName.js';
import type { Account } from '@/providers/types/Account.js';
import { useThirdPartyProfileStore } from '@/store/useProfileStore/useThirdPartyProfileStore.js';

interface ThirdPartItemProps {
    source: ThirdPartySource | Source.Email;
    icon: FunctionComponent<SVGAttributes<SVGElement>>;
    iconWidth: number;
    iconHeight: number;
    iconClassName?: string;
    account?: Account;
    loading?: boolean;
    onDisconnected?: () => void;
}

function ThirdPartItem({
    source,
    icon: PlatformIcon,
    iconClassName,
    iconWidth,
    iconHeight,
    account,
    loading,
    onDisconnected,
}: ThirdPartItemProps) {
    const connected = !!account;

    return (
        <div className="inline-flex h-[63px] w-full items-center justify-start gap-3 rounded-lg border border-line bg-white bg-bottom px-3 py-2 backdrop-blur dark:bg-bg">
            <div className={classNames('flex size-10 items-center justify-center rounded-full', iconClassName)}>
                <PlatformIcon width={iconWidth} height={iconHeight} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-bold text-lightMain">{resolveSourceName(source)}</span>
                {connected ? (
                    <span className="truncate text-medium text-second">
                        {formatThirdPartyProfileName(account.profile)}
                    </span>
                ) : null}
            </div>
            {loading ? (
                <LoadingIcon className="text-lightMain" />
            ) : connected ? (
                <ThirdPartDisconnectButton account={account} onSucceed={onDisconnected} />
            ) : (
                <ThirdPartConnectButton source={source} />
            )}
        </div>
    );
}

const platforms = [
    {
        source: Source.Google,
        icon: GoogleIcon,
        iconClassName: 'border border-[#E8E8FF] bg-white',
        iconWidth: 26,
        iconHeight: 25,
        platform: SourceInURL.Google,
    },
    {
        source: Source.Telegram,
        icon: TelegramIcon,
        iconClassName: '',
        iconWidth: 40,
        iconHeight: 40,
        platform: SourceInURL.Telegram,
    },
    {
        source: Source.Apple,
        icon: AppleIcon,
        iconClassName: 'bg-black text-white dark:bg-white dark:text-black',
        iconWidth: 19,
        iconHeight: 24,
        platform: SourceInURL.Apple,
    },
    {
        source: Source.Email,
        icon: EmailIcon,
        iconClassName: 'bg-black text-white dark:bg-white dark:text-black',
        iconWidth: 24,
        iconHeight: 20,
        platform: SourceInURL.Email,
    },
] as const;

export function ThirdPartAccounts() {
    const { accounts } = useThirdPartyProfileStore();
    const profileIds = useCurrentProfileIds();

    const allProfileIds = useMemo(() => {
        return compact([...profileIds, ...accounts.map((x) => x?.profile?.profileId)]);
    }, [accounts, profileIds]);

    const { isLoading, data, refetch } = useQuery({
        queryKey: ['allConnections', ...allProfileIds],
        enabled: !!allProfileIds.length,
        queryFn: () => runInSafeAsync(() => getAllConnections()),
    });

    return (
        <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full items-center justify-between">
                <span className="text-base font-bold leading-[18px] text-main">
                    <Trans>Others</Trans>
                </span>
            </div>
            {platforms.map((x) => {
                const account = formatAccountFromConnections(x.platform, data);
                return (
                    <ThirdPartItem
                        key={x.source}
                        source={x.source}
                        icon={x.icon}
                        iconWidth={x.iconWidth}
                        iconHeight={x.iconHeight}
                        iconClassName={x.iconClassName}
                        account={account}
                        loading={isLoading}
                        onDisconnected={refetch}
                    />
                );
            })}
        </div>
    );
}
