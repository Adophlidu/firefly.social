'use client';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PolymarketVolumeTraded } from '@/components/Polymarket/PolymarketVolumeTraded.js';
import { toRate } from '@/components/Polymarket/toRate.js';
import { Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import type { PolymarketProfileData } from '@/providers/types/Firefly.js';

interface PolymarketProfileOverviewProps {
    profile?: PolymarketProfileData;
    address: string;
}

export function PolymarketProfileOverview({ profile, address }: PolymarketProfileOverviewProps) {
    const dataConfig = useMemo(() => {
        return [
            {
                label: <Trans>Polymarket PnL</Trans>,
                value: (
                    <span className={!profile ? '' : profile.pnl < 0 ? 'text-danger' : 'text-success'}>
                        {formatPolymarketNumber(profile?.pnl, { symbol: true })}
                    </span>
                ),
            },
            {
                label: <Trans>Markets Traded</Trans>,
                value: <span>{profile?.position_traded ?? '-'}</span>,
            },
            {
                label: <Trans>Volume Traded(shares)</Trans>,
                value: <PolymarketVolumeTraded key="volume-traded" address={address} proxyAddress={profile?.proxy} />,
            },
            {
                label: <Trans>Current Positions</Trans>,
                value: <span>{formatPolymarketNumber(profile?.notfill_balance)}</span>,
            },
            {
                label: <Trans>Available Balance</Trans>,
                value: <span>{!profile ? '-' : `$${formatPrice(profile.cash_balance)}`}</span>,
            },
            {
                label: <Trans>Win Rate</Trans>,
                value: <span>{toRate(profile?.win_rate)}</span>,
            },
            {
                label: <Trans>Total Value</Trans>,
                value: <span>{formatPolymarketNumber(profile?.balance)}</span>,
            },
            {
                label: <Trans>Total Losses</Trans>,
                value: (
                    <span>
                        {formatPolymarketNumber(profile?.losses, {
                            symbol: true,
                        })}
                    </span>
                ),
            },
            {
                label: <Trans>Total Gains</Trans>,
                value: (
                    <span>
                        {formatPolymarketNumber(profile?.gains, {
                            symbol: true,
                        })}
                    </span>
                ),
            },
        ];
    }, [address, profile]);
    const tags = useMemo(() => {
        if (!profile) return [];
        return compact([profile.pnl1m, profile.win_rate67, profile.join1year, profile.pnl100]);
    }, [profile]);

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-4 px-4 pt-3">
                <Avatar
                    src={profile?.platform_avatar ?? getStampAvatarByProfileId(Source.Wallet, address)}
                    alt="avatar"
                    size={40}
                    className="size-10 rounded-full border border-highlight"
                />
                <div>
                    <div className="text-lg font-semibold text-main">{profile?.platform_name ?? 'Polymarket'}</div>
                    <div className="ml-auto flex items-center text-[13px] font-medium text-second">
                        {formatAddressEthereum(address, 4, 2)}
                        <CopyTextButton
                            className="ml-2 text-second"
                            size={14}
                            text={address}
                            data-prevent-progress
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        />
                    </div>
                </div>
            </div>
            {tags.length ? (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    {tags.map((tag, i) => (
                        <span
                            key={i}
                            className="h-[26px] rounded-full border border-line bg-lightBg px-3 font-inter text-xs font-medium !leading-6 text-main"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            ) : null}
            <div className="flex flex-col gap-4 p-4">
                <div className="text-base font-bold leading-6 text-main">
                    <Trans>Overview</Trans>
                </div>
                <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3">
                    {dataConfig.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1 rounded-xl bg-lightBg p-3">
                            <span className="text-xs text-second">{item.label}</span>
                            <div className="text-sm font-semibold text-main">{item.value ?? '-'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
