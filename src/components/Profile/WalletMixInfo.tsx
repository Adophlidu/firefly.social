'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQueries } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';

import EvmIcon from '@/assets/evm.svg';
import SolanaIcon from '@/assets/solana.svg';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { NetworkType, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByFireflyProfile } from '@/helpers/getStampAvatarByProfileId.js';
import { getUserTotalBalance } from '@/providers/debank/getUserTotalBalance.js';
import { getUserSolanaTotalValue } from '@/providers/okx/getUserSolanaTotalValue.js';
import { type FireflyProfile } from '@/providers/types/Firefly.js';

interface Props {
    profiles?: FireflyProfile[];
}

export function WalletMixInfo({ profiles = EMPTY_LIST }: Props) {
    const walletProfiles = profiles
        .filter((profile) => profile.identity.source === Source.Wallet)
        .map((x) => ({ ...x, type: getAddressType(x.identity.id) }))
        .sort((a, b) => (b.isDefault === a.isDefault ? 0 : b.isDefault ? -1 : 1));
    const defaultWalletProfiles = walletProfiles.slice(0, 2);
    const remaining = walletProfiles.slice(defaultWalletProfiles.length);

    const { data: totalBalance, isLoading } = useQueries({
        queries: walletProfiles.map((profile) => {
            const address = profile.identity.id;
            const networkType = getAddressType(address)!;
            return {
                queryKey: ['wallet', 'total-balance', networkType, address.toLowerCase()],
                async queryFn() {
                    if (!networkType) return null;

                    switch (networkType) {
                        case NetworkType.Ethereum:
                            return getUserTotalBalance(address);
                        case NetworkType.Solana:
                            return getUserSolanaTotalValue(address);
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
            <div className="flex w-full flex-col justify-between md:flex-row-reverse">
                <div className="mb-2 flex flex-row space-x-1 text-xs">
                    {defaultWalletProfiles.map((profile) => (
                        <Link
                            key={profile.identity.id}
                            href={getProfileUrl({ source: Source.Wallet, profileId: profile.identity.id })}
                            className="flex h-6 flex-row items-center space-x-1 rounded bg-primaryBottom px-2"
                        >
                            {profile.type === NetworkType.Ethereum ? (
                                <EvmIcon />
                            ) : profile.type === NetworkType.Solana ? (
                                <SolanaIcon />
                            ) : null}
                            <span>{formatAddress(profile.identity.id, 4)}</span>
                        </Link>
                    ))}
                    {remaining.length > 0 ? (
                        <Menu>
                            <MenuButton className="flex h-6 flex-row items-center rounded bg-primaryBottom px-2">
                                <Trans>{remaining.length}+</Trans>
                            </MenuButton>
                            <MenuItems
                                transition
                                anchor="bottom end"
                                className="z-[1000] w-max origin-top-right overflow-y-auto rounded-2xl border border-line bg-primaryBottom text-base text-main duration-100 data-[closed]:scale-95 data-[closed]:opacity-0"
                            >
                                <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto py-3">
                                    {remaining.map((profile) => (
                                        <MenuItem key={profile.identity.id}>
                                            <Link
                                                href={getProfileUrl({
                                                    source: Source.Wallet,
                                                    profileId: profile.identity.id,
                                                })}
                                                className="flex h-8 cursor-pointer items-center space-x-2 px-3 py-1 hover:bg-bg"
                                            >
                                                <Avatar
                                                    size={18}
                                                    alt={profile.identity.id}
                                                    src={getStampAvatarByFireflyProfile(profile)}
                                                />
                                                <span className="font-bold leading-[22px] text-main">
                                                    {profile.displayName}
                                                </span>
                                            </Link>
                                        </MenuItem>
                                    ))}
                                </div>
                            </MenuItems>
                        </Menu>
                    ) : null}
                </div>
                <div className="mb-2.5 flex w-full flex-row justify-between">
                    <div className="text-medium font-bold uppercase leading-6 text-second">
                        <Trans>Net Worth</Trans>
                    </div>
                </div>
            </div>
            <div
                className={classNames('h-6 text-2xl font-bold', {
                    'w-[120px] animate-pulse bg-main/25': isLoading,
                })}
            >
                {isLoading ? null : `$ ${formatPrice(totalBalance ?? 0)}`}
            </div>
        </div>
    );
}
