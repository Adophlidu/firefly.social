'use client';

import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { useQueries } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { isAddress } from 'viem';

import EvmIcon from '@/assets/evm.svg';
import SolanaIcon from '@/assets/solana.svg';
import { Link } from '@/components/Link.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { Debank } from '@/providers/debank/index.js';
import { OKX } from '@/providers/okx/index.js';
import type { FireflyProfile } from '@/providers/types/Firefly.js';

interface Props {
    profiles?: FireflyProfile[];
}

export function WalletMixInfo({ profiles = [] }: Props) {
    const walletProfiles = profiles.filter((profile) => profile.identity.source === Source.Wallet);
    const evmProfiles = walletProfiles.filter(
        (profile) => profile.identity.source === Source.Wallet && isAddress(profile.identity.id),
    );
    const solanaProfiles = walletProfiles.filter(
        (profile) => profile.identity.source === Source.Wallet && isValidSolanaAddress(profile.identity.id),
    );
    const evmPrimaryProfile = evmProfiles.find((x) => x.isDefault) || evmProfiles[0];
    const solanaPrimaryProfile = solanaProfiles.find((x) => x.isDefault) || solanaProfiles[0];
    const remaining = walletProfiles.filter((x) => x.identity.source === Source.Wallet && !x.isDefault);

    const { data: totalBalance, isLoading } = useQueries({
        queries: walletProfiles.map((profile) => {
            const address = profile.identity.id;
            const networkType = getAddressType(address)!;
            return {
                queryKey: ['wallet', 'total-balance', networkType, address],
                async queryFn() {
                    if (!networkType) return null;
                    switch (networkType) {
                        case NetworkType.Ethereum:
                            return Debank.getUserTotalBalance(address);
                        case NetworkType.Solana:
                            return OKX.getUserSolanaTotalValue(address);
                        default:
                            safeUnreachable(networkType);
                            return null;
                    }
                },
            };
        }),
        combine(results) {
            return {
                data: results
                    .reduce((acc, result) => (result.data ? acc.plus(result.data) : acc), BigNumber(0))
                    .toString(),
                isLoading: results.some((result) => result.isLoading),
            };
        },
    });

    return (
        <div className="flex w-full flex-col p-4">
            <div className="mb-2.5 flex w-full flex-row justify-between">
                <div className="text-medium font-bold uppercase leading-6 text-second">
                    <Trans>Net Worth</Trans>
                </div>
                <div className="flex flex-row space-x-1 text-xs">
                    {evmPrimaryProfile ? (
                        <Link
                            href={resolveProfileUrl(Source.Wallet, evmPrimaryProfile.identity.id)}
                            className="flex h-6 flex-row items-center space-x-1 rounded bg-primaryBottom px-2"
                        >
                            <EvmIcon />
                            <span>{formatAddress(evmPrimaryProfile.identity.id, 4)}</span>
                        </Link>
                    ) : null}
                    {solanaPrimaryProfile ? (
                        <Link
                            href={resolveProfileUrl(Source.Wallet, solanaPrimaryProfile.identity.id)}
                            className="flex h-6 flex-row items-center space-x-1 rounded bg-primaryBottom px-2"
                        >
                            <SolanaIcon />
                            <span>{formatAddress(solanaPrimaryProfile.identity.id, 4)}</span>
                        </Link>
                    ) : null}
                    {remaining.length > 0 ? (
                        <div className="flex h-6 flex-row items-center rounded bg-primaryBottom px-2">
                            <Trans>{remaining.length}+</Trans>
                        </div>
                    ) : null}
                </div>
            </div>
            <div
                className={classNames('h-6 text-2xl font-bold', {
                    'w-[120px] animate-pulse bg-main/25': isLoading,
                })}
            >
                {isLoading ? null : <Trans>$ {formatPrice(totalBalance ?? 0)}</Trans>}
            </div>
        </div>
    );
}
