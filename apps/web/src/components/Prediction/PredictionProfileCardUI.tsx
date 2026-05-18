'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { formatAddressEthereum } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { CopyTextButton } from '@/components/CopyTextButton.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PredictionPlatformIcon } from '@/components/Prediction/PredictionPlatformIcon.js';
import { PredictionPlatformName } from '@/components/Prediction/PredictionPlatformName.js';
import { Link } from '@/esm/Link.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';
import { useProxyWalletInfo } from '@/hooks/prediction/useProxyWalletInfo.js';
import {
    captureOpinionProfileDetailClick,
    capturePolymarketProfileDetailClick,
} from '@/providers/telemetry/capturePolymarketEvent.js';
import type { BetPortfolioItem } from '@/providers/types/Firefly.js';

interface PredictionProfileCardUIProps {
    profile: BetPortfolioItem;
}

export const PredictionProfileCardUI = memo<PredictionProfileCardUIProps>(function BetsProfileCard({ profile }) {
    const { data: socialProfile } = useProxyWalletInfo(profile.platform, profile.proxy);

    const isFireflyUser = useMemo(() => !!socialProfile?.account, [socialProfile]);
    const targetFireflyAccountId = useMemo(
        () => socialProfile?.account?.accountID || socialProfile?.fireflyAccountId,
        [socialProfile],
    );

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (profile.platform === PredictionPlatform.Polymarket) {
            capturePolymarketProfileDetailClick({
                target_polymarket_name: profile.platform_name,
                target_proxy_wallet_address: profile.proxy,
                target_wallet_address: profile.wallet,
                is_firefly_user: isFireflyUser,
                target_firefly_account_id: targetFireflyAccountId,
            });
        } else if (profile.platform === PredictionPlatform.Opinion) {
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
        <Link
            className="bg-primaryBottom flex justify-evenly gap-3 rounded-xl p-3"
            href={RouteResolver.betsProfile(profile.proxy, {
                platform: profile.platform,
            })}
            onClick={handleProfileClick}
            data-disable-progress
        >
            <div className="text-main flex flex-1 items-center gap-2">
                <PredictionPlatformIcon platform={profile.platform} className="shrink-0 rounded-full" size={32} />
                <div className="flex h-9 w-28 flex-col items-start">
                    <div className="w-full shrink-0 truncate text-sm font-semibold">
                        {profile.platform_name || <PredictionPlatformName platform={profile.platform} />}
                    </div>
                    <div className="text-second ml-auto flex items-center text-[13px] font-medium">
                        {formatAddressEthereum(profile.proxy, 4, 2)}
                        <CopyTextButton
                            className="text-second ml-2"
                            size={14}
                            text={profile.proxy}
                            data-prevent-progress
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="flex h-9 flex-1 shrink-0 flex-col items-end justify-between gap-1">
                <div className="text-second text-xs">
                    <Trans>Portfolio</Trans>
                </div>
                <div className="text-main relative text-sm font-semibold">
                    {`$${profile ? formatPrice(profile.balance.toFixed(2)) : '-'}`}
                </div>
            </div>
            <div className="flex h-9 flex-1 shrink-0 flex-col items-end justify-between gap-1">
                <div className="text-second text-xs">
                    <Trans>PnL</Trans>
                </div>
                <div className="text-success relative">
                    <span
                        className={`text-sm font-semibold ${
                            !profile ? '' : profile.pnl < 0 ? 'text-danger' : 'text-success'
                        }`}
                    >
                        {formatPolymarketNumber(profile?.pnl, { sign: true })}
                        {/* <span className="ml-0.5 text-xs font-normal">{toRate(profile?.pnl_rate)}</span> */}
                    </span>
                </div>
            </div>
        </Link>
    );
});
