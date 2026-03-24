'use client';

import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { memo, useMemo } from 'react';

import BaseIcon from '@/assets/base.svg';
import EnsIcon from '@/assets/ens.svg';
import EvmIcon from '@/assets/evm.svg';
import SolanaIcon from '@/assets/solana.svg';
import { InteractiveTippy } from '@/components/InteractiveTippy.js';
import { RelatedSourceIcon } from '@/components/RelatedSourceIcon.js';
import { Tooltip } from '@/components/Tooltip.js';
import { NetworkType } from '@/constants/enum.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { fireflyWalletProvider } from '@/providers/firefly/Wallet.js';
import { RelatedWalletSource, type VerifiedSource, type WalletProfile } from '@/providers/types/Firefly.js';

interface WalletProfileTagsProps {
    profile: WalletProfile;
}

const ICON_SIZE = 16;

function resolveVerifiedText({ source, provider }: VerifiedSource) {
    switch (source) {
        case RelatedWalletSource.farcaster:
            return <Trans>Verified by Farcaster</Trans>;
        case RelatedWalletSource.lens:
            return <Trans>Verified by Lens</Trans>;
        case RelatedWalletSource.firefly:
        case RelatedWalletSource.twitter:
            return <Trans>Verified by Firefly</Trans>;
        case RelatedWalletSource.cyber:
        case RelatedWalletSource.hand_writing:
        case RelatedWalletSource.opensea:
        case RelatedWalletSource.pfp:
        case RelatedWalletSource.rss3:
        case RelatedWalletSource.twitter_hexagon:
        case RelatedWalletSource.uniswap:
        case RelatedWalletSource.ethLeaderboard:
        case RelatedWalletSource.other:
        case RelatedWalletSource.particle:
            return <Trans>Verified by {provider}</Trans>;
        default:
            safeUnreachable(source);
            return <Trans>Verified by {provider}</Trans>;
    }
}

export const WalletProfileTags = memo<WalletProfileTagsProps>(function WalletProfileTags({ profile }) {
    const networkType = getAddressType(profile.address, false);
    const { data: walletRelation, isLoading } = useQuery({
        queryKey: ['wallet-relation', profile.address.toLowerCase()],
        queryFn: () => fireflyWalletProvider.getWalletRelation(profile.address),
    });

    const allEnsList = useMemo<
        Array<{
            id: string;
            Icon: typeof EnsIcon;
            ensList: string[];
            className?: string;
            itemClassName?: string;
        }>
    >(() => {
        if (networkType === NetworkType.Ethereum) {
            return compact([
                profile.ens?.length
                    ? {
                          id: 'ens',
                          Icon: EnsIcon,
                          className: 'grayscale',
                          ensList: profile.ens,
                      }
                    : null,
                profile.baseEth?.length
                    ? {
                          id: 'baseEth',
                          Icon: BaseIcon,
                          className: 'text-[#767676]',
                          itemClassName: 'text-[#0052ff]',
                          ensList: profile.baseEth.map((baseEns) => baseEns.handle),
                      }
                    : null,
            ]);
        }
        if (networkType === NetworkType.Solana) {
            const allList = [
                ...(profile.sns?.length ? profile.sns : []),
                ...(profile.seekerId?.length ? profile.seekerId : []),
            ];
            if (!allList.length) return [];

            return [
                {
                    id: 'solana',
                    Icon: SolanaIcon,
                    ensList: allList.map((x) => x.handle),
                },
            ];
        }

        return [];
    }, [networkType, profile.ens, profile.baseEth, profile.sns, profile.seekerId]);

    if (isLoading) {
        return <div className="ml-1 mr-auto h-6 w-[120px] animate-pulse bg-bg" />;
    }

    const dynamicTagsCount =
        (walletRelation?.verifiedSources?.filter((x) =>
            [RelatedWalletSource.lens, RelatedWalletSource.farcaster, RelatedWalletSource.twitter].includes(x.source),
        )?.length ?? 0) + allEnsList.length;

    return (
        <div
            className={classNames(
                'ml-1 mr-auto flex h-6 flex-row items-center',
                dynamicTagsCount >= 4 ? 'gap-0.5' : 'gap-1.5',
            )}
        >
            {networkType === NetworkType.Ethereum ? <EvmIcon width={ICON_SIZE} height={ICON_SIZE} /> : null}
            {networkType === NetworkType.Solana ? <SolanaIcon width={ICON_SIZE} height={ICON_SIZE} /> : null}
            {walletRelation?.verifiedSources?.map((x) => {
                return (
                    <Tooltip key={x.source} content={resolveVerifiedText(x)} placement="bottom">
                        <RelatedSourceIcon className="cursor-pointer" source={x.source} size={ICON_SIZE - 2} />
                    </Tooltip>
                );
            })}
            {allEnsList.map(({ Icon, ensList, id, className, itemClassName }) => (
                <InteractiveTippy
                    key={id}
                    maxWidth={304}
                    className="tippy-card"
                    placement="bottom"
                    content={
                        <div className="no-scrollbar flex max-h-[100px] flex-wrap gap-x-[15px] overflow-auto rounded-2xl border-[0.5px] border-secondaryLine bg-primaryBottom p-3">
                            {ensList.map((ens) => {
                                return (
                                    <div className="flex items-center gap-[5px]" key={`${id}-${ens}`}>
                                        <Icon width={16} height={16} className={itemClassName} />
                                        <span className="text-[10px] font-bold leading-4 text-main">{ens}</span>
                                    </div>
                                );
                            })}
                        </div>
                    }
                >
                    <span>
                        <Icon
                            width={ICON_SIZE}
                            height={ICON_SIZE}
                            className={classNames('cursor-pointer', className)}
                        />
                    </span>
                </InteractiveTippy>
            ))}
        </div>
    );
});
