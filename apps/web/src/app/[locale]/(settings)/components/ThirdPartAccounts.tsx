'use client';

import AppleIcon from '@dimensiondev/assets/apple-small.svg';
import EmailIcon from '@dimensiondev/assets/email.svg';
import GoogleIcon from '@dimensiondev/assets/google-small.svg';
import TelegramIcon from '@dimensiondev/assets/telegram.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type FunctionComponent, type SVGAttributes, useMemo } from 'react';

import { ThirdPartConnectButton } from '@/app/[locale]/(settings)/components/ThirdPartConnectButton.js';
import { ThirdPartDisconnectButton } from '@/app/[locale]/(settings)/components/ThirdPartDisconnectButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Source, SourceInURL, type ThirdPartySource } from '@/constants/enum.js';
import { formatAccountFromConnections } from '@/helpers/formatAccountFromConnections.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';
import { formatThirdPartyProfileName } from '@/providers/lens/formatThirdPartyProfileName.js';
import { type Account } from '@/providers/types/Account.js';
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
        <div className="border-line dark:bg-bg inline-flex h-[63px] w-full items-center justify-start gap-3 rounded-lg border bg-white bg-bottom px-3 py-2 backdrop-blur">
            <div className={classNames('flex size-10 items-center justify-center rounded-full', iconClassName)}>
                <PlatformIcon width={iconWidth} height={iconHeight} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-lightMain truncate text-base font-bold">{resolveSourceName(source)}</span>
                {connected ? (
                    <span className="text-medium text-second truncate">
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
                <span className="text-main text-base font-bold leading-[18px]">
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
