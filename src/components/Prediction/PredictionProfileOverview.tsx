'use client';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PolymarketVolumeTraded } from '@/components/Polymarket/PolymarketVolumeTraded.js';
import { toRate } from '@/components/Polymarket/toRate.js';
import { extractFallbackInfo } from '@/components/Prediction/extractFallbackInfo.js';
import { PredictionPlatformName } from '@/components/Prediction/PredictionPlatformName.js';
import { ProfileSourceIcon } from '@/components/ProfileSourceIcon.js';
import { PredictionPlatform, Source } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { formatTokenUSD } from '@/helpers/formatTokenUSD.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSocialSource } from '@/helpers/isSource.js';
import { isZero } from '@/helpers/number.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { useProxyWalletInfo } from '@/hooks/prediction/useProxyWalletInfo.js';
import {
    captureOpinionProfileDetailClick,
    capturePolymarketProfileDetailClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import { type PredictionProfileDataForUI } from '@/types/prediction.js';

interface PredictionProfileOverviewProps {
    profile: PredictionProfileDataForUI;
    address: string;
    platform: PredictionPlatform;
}

export function PredictionProfileOverview({ profile, platform, address }: PredictionProfileOverviewProps) {
    const isOpinion = platform === PredictionPlatform.Opinion;

    const { data: socialProfile } = useProxyWalletInfo(platform, address);

    const {
        name: socialName,
        avatar: socialAvatar,
        source,
    } = useMemo(() => {
        if (!socialProfile) return { name: undefined, avatar: undefined };
        return extractFallbackInfo(socialProfile);
    }, [socialProfile]);

    const dataConfig = useMemo(() => {
        return compact([
            {
                label: (
                    <Trans>
                        <PredictionPlatformName platform={platform} /> PnL
                    </Trans>
                ),
                value: (
                    <span className={profile.pnl < 0 ? 'text-danger' : 'text-success'}>
                        {formatPolymarketNumber(profile.pnl, { sign: true })}
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
                value: <span>{isZero(profile.cash_balance) ? '$0' : `${formatTokenUSD(profile.cash_balance)}`}</span>,
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
                              {profile.losses
                                  ? `${formatPolymarketNumber(-Math.abs(profile.losses), {
                                        sign: true,
                                    })}`
                                  : 0}
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
                                  sign: true,
                              })}
                          </span>
                      ),
                  },
        ]);
    }, [address, profile, isOpinion, platform]);

    const profileUrl = resolveProfileUrl(Source.Wallet, profile.wallet || profile.proxy);

    const handleWalletProfileClick = () => {
        const isFireflyUser = !!socialProfile?.account;
        const targetFireflyAccountId = socialProfile?.account?.accountID || socialProfile?.fireflyAccountId;

        if (platform === PredictionPlatform.Polymarket) {
            capturePolymarketProfileDetailClick({
                target_polymarket_name: profile.platform_name,
                target_proxy_wallet_address: profile.proxy,
                target_wallet_address: profile.wallet,
                is_firefly_user: isFireflyUser,
                target_firefly_account_id: targetFireflyAccountId,
            });
        } else if (platform === PredictionPlatform.Opinion) {
            captureOpinionProfileDetailClick({
                target_opinion_name: profile.platform_name,
                target_proxy_wallet_address: profile.proxy,
                target_wallet_address: profile.wallet,
                is_firefly_user: isFireflyUser,
                target_firefly_account_id: targetFireflyAccountId,
            });
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-4 px-4 pt-3">
                <Link href={profileUrl} className="relative" onClick={handleWalletProfileClick}>
                    <Avatar
                        src={
                            socialAvatar ||
                            profile.platform_avatar ||
                            getStampAvatarByProfileId(Source.Wallet, profile.wallet)
                        }
                        alt="avatar"
                        size={40}
                        className="size-10 rounded-full border border-highlight"
                    />
                    {isSocialSource(source) ? (
                        <ProfileSourceIcon
                            source={source}
                            size={16}
                            className="absolute -bottom-1 -right-2 z-10 size-4 rounded-full border border-white"
                        />
                    ) : null}
                </Link>
                <div className="min-w-0">
                    <Link
                        className="block truncate whitespace-nowrap text-lg font-semibold text-main"
                        href={profileUrl}
                        onClick={handleWalletProfileClick}
                    >
                        {socialName || profile.platform_name || <PredictionPlatformName platform={platform} />}
                    </Link>
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
