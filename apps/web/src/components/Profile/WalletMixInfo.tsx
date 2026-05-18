'use client';

import { Source } from '@dimensiondev/enums';
import EvmIcon from '@dimensiondev/assets/evm.svg';
import FireflyLogo from '@dimensiondev/assets/firefly.round.svg';
import SolanaIcon from '@dimensiondev/assets/solana.svg';
import { EMPTY_LIST } from '@dimensiondev/constants';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { NetworkType } from '@dimensiondev/web3/enums';
import { formatAddress, getAddressType } from '@dimensiondev/web3/utils';
import { MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { useQueries } from '@tanstack/react-query';
import { BigNumber } from 'bignumber.js';
import { useState } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';

import { formatPrice } from '@/helpers/formatPrice.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByFireflyProfile } from '@/helpers/getStampAvatarByProfileId.js';
import { isMPCWallet, isPrivyMPCWallet } from '@/helpers/isMPCWallet.js';
import { getUserTotalBalance } from '@/providers/debank/getUserTotalBalance.js';
import { getUserSolanaTotalValue } from '@/providers/okx/getUserSolanaTotalValue.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';

interface Props {
    profiles?: FireflyProfile[];
    hasFireflyAccount?: boolean;
}

export function WalletMixInfo({ profiles = EMPTY_LIST, hasFireflyAccount = false }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);

    const walletProfiles = profiles
        .filter((profile) => profile.identity.source === Source.Wallet)
        .map((x) => ({ ...x, type: getAddressType(x.identity.id) }));

    const shouldCollapse = hasFireflyAccount && !isExpanded;
    const defaultWalletProfiles = shouldCollapse
        ? walletProfiles.filter((profile) => {
              const origin = profile.__origin__ as WalletProfile;
              return profile.isDefault || (origin && isPrivyMPCWallet(origin));
          })
        : walletProfiles.slice(0, 2);
    const remaining = shouldCollapse
        ? walletProfiles.filter((profile) => {
              const origin = profile.__origin__ as WalletProfile;
              return !profile.isDefault && !(origin && isPrivyMPCWallet(origin));
          })
        : walletProfiles.slice(defaultWalletProfiles.length);

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
                    {defaultWalletProfiles.map((profile) => {
                        const origin = profile.__origin__ as WalletProfile;
                        const isMPC = origin && isMPCWallet(origin);
                        return (
                            <Link
                                key={profile.identity.id}
                                href={getProfileUrl({ source: Source.Wallet, profileId: profile.identity.id })}
                                className="bg-primaryBottom flex h-6 flex-row items-center space-x-1 rounded px-2"
                            >
                                {isMPC ? (
                                    <FireflyLogo width={16} height={16} />
                                ) : profile.type === NetworkType.Ethereum ? (
                                    <EvmIcon />
                                ) : profile.type === NetworkType.Solana ? (
                                    <SolanaIcon />
                                ) : null}
                                <span>{formatAddress(profile.identity.id, 4)}</span>
                            </Link>
                        );
                    })}
                    {shouldCollapse && remaining.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(true)}
                            className="bg-primaryBottom flex h-6 flex-row items-center rounded px-2 hover:opacity-80"
                        >
                            <Trans>View all</Trans>
                        </button>
                    ) : remaining.length > 0 ? (
                        <MoreActionMenu
                            loginRequired={false}
                            useTransition={false}
                            menuButton={
                                <MenuButton className="bg-primaryBottom flex h-6 flex-row items-center rounded px-2">
                                    {remaining.length}+
                                </MenuButton>
                            }
                        >
                            <MenuItems
                                transition
                                anchor="bottom end"
                                className="border-line bg-primaryBottom text-main z-[1000] w-max origin-top-right overflow-y-auto rounded-2xl border text-base duration-100 data-[closed]:scale-95 data-[closed]:opacity-0"
                            >
                                <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto py-3">
                                    {remaining.map((profile) => (
                                        <MenuItem key={profile.identity.id}>
                                            <Link
                                                href={getProfileUrl({
                                                    source: Source.Wallet,
                                                    profileId: profile.identity.id,
                                                })}
                                                className="hover:bg-bg flex h-8 cursor-pointer items-center space-x-2 px-3 py-1"
                                            >
                                                <Avatar
                                                    size={18}
                                                    alt={profile.identity.id}
                                                    src={getStampAvatarByFireflyProfile(profile)}
                                                />
                                                <span className="text-main font-bold leading-[22px]">
                                                    {profile.displayName}
                                                </span>
                                            </Link>
                                        </MenuItem>
                                    ))}
                                </div>
                            </MenuItems>
                        </MoreActionMenu>
                    ) : null}
                </div>
                <div className="mb-2.5 flex w-full flex-row justify-between">
                    <div className="text-medium text-second font-bold uppercase leading-6">
                        <Trans>Net Worth</Trans>
                    </div>
                </div>
            </div>
            <div
                className={classNames('h-6 text-2xl font-bold', {
                    'bg-main/25 w-[120px] animate-pulse': isLoading,
                })}
            >
                {isLoading ? null : `$ ${formatPrice(totalBalance ?? 0)}`}
            </div>
        </div>
    );
}
