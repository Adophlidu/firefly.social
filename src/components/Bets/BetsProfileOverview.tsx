'use client';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { BetsPlatformName } from '@/components/Bets/BetsPlatformName.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PolymarketVolumeTraded } from '@/components/Polymarket/PolymarketVolumeTraded.js';
import { toRate } from '@/components/Polymarket/toRate.js';
import { BetsPlatform, Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { type BetsProfileDataForUI } from '@/types/bets.js';

interface BetsProfileOverviewProps {
    profile: BetsProfileDataForUI;
    address: string;
    platform: BetsPlatform;
}

export function BetsProfileOverview({ profile, platform, address }: BetsProfileOverviewProps) {
    const isOpinion = platform === BetsPlatform.Opinion;

    const dataConfig = useMemo(() => {
        return compact([
            {
                label: (
                    <Trans>
                        <BetsPlatformName platform={platform} /> PnL
                    </Trans>
                ),
                value: (
                    <span className={profile.pnl < 0 ? 'text-danger' : 'text-success'}>
                        {formatPolymarketNumber(profile.pnl, { symbol: true })}
                    </span>
                ),
            },
            isOpinion
                ? null
                : {
                      label: <Trans>Markets Traded</Trans>,
                      value: <span>{profile.position_traded ?? '-'}</span>,
                  },
            {
                label: isOpinion ? <Trans>Volume Traded</Trans> : <Trans>Volume Traded(shares)</Trans>,
                value: isOpinion ? (
                    profile.volume && profile.volume > 1 ? (
                        Math.floor(profile.volume)
                    ) : (
                        formatPolymarketNumber(profile.volume) || '0'
                    )
                ) : (
                    <PolymarketVolumeTraded key="volume-traded" address={address} proxyAddress={profile.proxy} />
                ),
            },
            {
                label: <Trans>Current Positions</Trans>,
                value: <span>{formatPolymarketNumber(profile.notfill_balance)}</span>,
            },
            {
                label: <Trans>Available Balance</Trans>,
                value: <span>{`$${formatPrice(profile.cash_balance)}`}</span>,
            },
            isOpinion
                ? null
                : {
                      label: <Trans>Win Rate</Trans>,
                      value: <span>{toRate(profile.win_rate)}</span>,
                  },
            {
                label: <Trans>Total Value</Trans>,
                value: <span>{formatPolymarketNumber(profile.balance)}</span>,
            },
            isOpinion
                ? null
                : {
                      label: <Trans>Total Losses</Trans>,
                      value: (
                          <span>
                              {`${formatPolymarketNumber(profile.losses, {
                                  symbol: false,
                              })}`}
                          </span>
                      ),
                  },
            isOpinion
                ? null
                : {
                      label: <Trans>Total Gains</Trans>,
                      value: (
                          <span>
                              {formatPolymarketNumber(profile.gains, {
                                  symbol: true,
                              })}
                          </span>
                      ),
                  },
        ]);
    }, [address, profile, isOpinion, platform]);

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-4 px-4 pt-3">
                <Avatar
                    src={profile.platform_avatar ?? getStampAvatarByProfileId(Source.Wallet, address)}
                    alt="avatar"
                    size={40}
                    className="size-10 rounded-full border border-highlight"
                />
                <div>
                    <div className="text-lg font-semibold text-main">
                        {profile.platform_name || <BetsPlatformName platform={platform} />}
                    </div>
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
            {profile.tags?.length ? (
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    {profile.tags.map((tag, i) => (
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
