'use client';

import FireflyLogo from '@dimensiondev/assets/firefly.round.svg';
import InfoIcon from '@dimensiondev/assets/info-outline.svg';
import WalletIcon from '@dimensiondev/assets/wallet-circle.svg';
import VerifiedDarkIcon from '@dimensiondev/assets/wallet-circle-verified.dark.svg';
import VerifiedLightIcon from '@dimensiondev/assets/wallet-circle-verified.light.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';

import { DisconnectBindAddressButton } from '@/app/[locale]/(settings)/components/DisconnectBindAddressButton.js';
import { PrimaryButton } from '@/app/[locale]/(settings)/components/PrimaryButton.js';
import { ReportButton } from '@/app/[locale]/(settings)/components/ReportButton.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { WalletSource } from '@/constants/enum.js';
import { formatAddressEthereum, formatAddressSolana } from '@/helpers/formatAddress.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { FireflyWalletConnection } from '@/providers/types/Firefly.js';

interface WalletItemProps {
    noAction?: boolean;
    connection: FireflyWalletConnection;
}

export function WalletItem({ connection, noAction = false }: WalletItemProps) {
    const isDark = useIsDarkMode();

    const isMPCWallet = connection.source === WalletSource.Particle || connection.source === WalletSource.Privy;
    const isConnected = 'isDefault' in connection && connection.isConnected;

    const Icon = isMPCWallet
        ? FireflyLogo
        : !connection.canReport
          ? isDark
              ? VerifiedDarkIcon
              : VerifiedLightIcon
          : WalletIcon;

    return (
        <motion.div
            key={`${connection.platform}-${connection.address}`}
            layoutId={`${connection.platform}-${connection.address}`}
            className="border-line text-medium dark:bg-bg inline-flex h-[63px] w-full items-center justify-start gap-2 rounded-lg border bg-white bg-bottom px-3 py-2 backdrop-blur"
        >
            {!noAction ? (
                <>
                    {isConnected ? (
                        <PrimaryButton
                            platform={resolveConnectionPlatform(connection.platform)}
                            platformId={connection.address}
                            isDefault={connection.isDefault}
                            tooltipContent={
                                connection.isDefault ? (
                                    <Trans>Primary wallet</Trans>
                                ) : (
                                    <Trans>Set as primary wallet</Trans>
                                )
                            }
                        />
                    ) : null}
                    {!connection.isConnected ? (
                        <Tooltip
                            placement="top"
                            content={
                                <Trans>
                                    It is wallet retrieved from public verifiable data registries or our entity
                                    algorithm. Please add this wallet to set as primary wallet.
                                </Trans>
                            }
                        >
                            <InfoIcon width={20} height={20} className="text-second size-5 shrink-0" />
                        </Tooltip>
                    ) : null}
                </>
            ) : null}
            <Icon className="shrink-0" width={24} height={24} />
            <div className="flex min-w-0 flex-1 flex-col text-left">
                {connection.ens?.[0] ? (
                    <span className="text-main flex items-center text-base font-bold">{connection.ens[0]}</span>
                ) : null}
                <div
                    className={classNames(
                        'flex items-center gap-1',
                        connection.ens?.[0] ? 'text-second' : 'text-main font-semibold',
                    )}
                >
                    <span className="flex items-center truncate">
                        {connection.platform === 'eth'
                            ? formatAddressEthereum(connection.address, 8)
                            : connection.platform === 'solana'
                              ? formatAddressSolana(connection.address, 8)
                              : connection.address}
                    </span>
                    <CopyTextButton text={connection.address} className="text-second" />
                </div>
            </div>
            {noAction ? null : (
                <>
                    {connection.canReport ? (
                        <ReportButton connection={connection} />
                    ) : (
                        <>
                            {isMPCWallet ? null : (
                                <>{isConnected ? <DisconnectBindAddressButton connection={connection} /> : null}</>
                            )}
                        </>
                    )}
                </>
            )}
        </motion.div>
    );
}
