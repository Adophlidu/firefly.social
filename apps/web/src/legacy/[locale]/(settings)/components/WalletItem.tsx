'use client';

import FireflyLogo from '@dimensiondev/assets/firefly.round.svg';
import InfoIcon from '@dimensiondev/assets/info-outline.svg';
import WalletIcon from '@dimensiondev/assets/wallet-circle.svg';
import VerifiedDarkIcon from '@dimensiondev/assets/wallet-circle-verified.dark.svg';
import VerifiedLightIcon from '@dimensiondev/assets/wallet-circle-verified.light.svg';
import { WalletSource } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { formatAddressEthereum, formatAddressSolana } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';

import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { resolveConnectionPlatform } from '@/helpers/resolveConnectionPlatform.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { DisconnectBindAddressButton } from '@/legacy/[locale]/(settings)/components/DisconnectBindAddressButton.js';
import { PrimaryButton } from '@/legacy/[locale]/(settings)/components/PrimaryButton.js';
import { ReportButton } from '@/legacy/[locale]/(settings)/components/ReportButton.js';
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
            className="inline-flex h-[63px] w-full items-center justify-start gap-2 rounded-lg border border-line bg-white bg-bottom px-3 py-2 text-medium backdrop-blur dark:bg-bg"
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
                            <InfoIcon width={20} height={20} className="size-5 shrink-0 text-second" />
                        </Tooltip>
                    ) : null}
                </>
            ) : null}
            <Icon className="shrink-0" width={24} height={24} />
            <div className="flex min-w-0 flex-1 flex-col text-left">
                {connection.ens?.[0] ? (
                    <span className="flex items-center text-base font-bold text-main">{connection.ens[0]}</span>
                ) : null}
                <div
                    className={classNames(
                        'flex items-center gap-1',
                        connection.ens?.[0] ? 'text-second' : 'font-semibold text-main',
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
