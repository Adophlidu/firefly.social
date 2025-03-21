import { Trans } from '@lingui/react/macro';
import { ChainId } from '@masknet/web3-shared-evm';
import { useQuery } from '@tanstack/react-query';
import { isNumber } from 'lodash-es';
import { memo } from 'react';

import SwapIcon from '@/assets/swap.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { ProfileAvatar } from '@/components/ProfileAvatar.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { Source } from '@/constants/enum.js';
import { formatEthereumAddress } from '@/helpers/formatAddress.js';
import { formatMarketCap } from '@/helpers/formatMarketCap.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { leftShift } from '@/helpers/number.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
import type { RocketsFunToken } from '@/providers/types/RocketsFun.js';

interface RocketsFunCardProps {
    token: RocketsFunToken;
    url: string;
}

function TokenCreator({ token }: { token: RocketsFunToken }) {
    const isLogin = useIsLogin(Source.Twitter);
    const invalid = token.platform !== 'X' || !token.userId || !isLogin;

    const { data, isLoading } = useQuery({
        queryKey: ['profile', Source.Twitter, token.userId],
        enabled: !invalid,
        staleTime: Infinity,
        queryFn: () => {
            return runInSafeAsync(() => TwitterSocialMediaProvider.getProfileById(token.userId));
        },
    });

    if (isLoading) {
        return <LoadingIcon />;
    }

    if (invalid || !data) {
        return (
            <>
                <Link className="text-black" href={resolveProfileUrl(Source.Wallet, token.deployer)}>
                    {formatEthereumAddress(token.deployer, 4)}
                </Link>
                <CopyTextButton text={token.deployer} className="text-lightSecond" />
            </>
        );
    }

    return (
        <>
            <ProfileAvatar linkable enableSourceIcon={false} profile={data} size={24} />
            <Link className="text-black" href={resolveProfileUrl(Source.Twitter, data.profileId)}>
                {data.displayName || data.handle}
            </Link>
        </>
    );
}

export const RocketsFunCard = memo<RocketsFunCardProps>(function RocketsFunCard({ token, url }) {
    return (
        <div className="rounded-2xl bg-lightBg p-3">
            <div className="flex items-start gap-2.5 md:items-center">
                <TokenIcon className="shrink-0" icon={token.imageUrl} chainId={ChainId.BSC} />
                <div className="flex min-w-0 flex-1 items-start justify-between md:items-center">
                    <div className="flex flex-col items-start gap-1.5 md:flex-row md:items-center">
                        <span className="text-lg font-bold leading-[22px] text-main">{token.name || 'Unknown'}</span>
                        <div>
                            <span className="text-sm font-bold leading-[18px] text-third">
                                {formatEthereumAddress(token.contractAddress, 4)}
                            </span>
                            <CopyTextButton text={token.contractAddress} className="text-third" />
                        </div>
                    </div>
                    <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 items-center gap-1 rounded-full bg-main px-3 text-xs font-bold text-primaryBottom"
                    >
                        <span className="text-xs font-bold">
                            <Trans>Swap</Trans>
                        </span>
                        <SwapIcon width={16} height={16} />
                    </Link>
                </div>
            </div>
            <div className="mt-3 flex flex-col items-start gap-4 md:flex-row md:items-center">
                <div>
                    <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-main">${formatMarketCap(token.market_cap, 4)}</span>
                        <span className="text-medium text-lightSecond">MC</span>
                        {/* <span className="h-3.5 rounded bg-highlight px-1 text-[10px] leading-[14px] text-white">
                            Rank #5
                        </span> */}
                    </div>
                    <div className="flex items-center gap-1 text-medium">
                        <span className="text-lightSecond">
                            <Trans>Price</Trans>
                        </span>
                        <span className="font-bold text-main">
                            ${renderShrankPrice(formatPrice(token.price) ?? '-')}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-3 rounded-lg border border-[#F3D645] bg-[#FAF5DC] p-2 text-medium font-bold text-main">
                <div className="flex flex-col items-start md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
                        <span className="text-medium font-normal text-lightSecond">
                            <Trans>Launched on</Trans>
                        </span>
                        <Image
                            className="h-6 w-6 shrink-0"
                            src={'/image/rockets-fun.png'}
                            width={24}
                            height={24}
                            alt="rockets"
                        />
                        <span className="text-black">
                            <Trans>Rockets.fun</Trans>
                        </span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-1 truncate">
                        <span className="text-medium font-normal text-lightSecond">
                            <Trans>Created by</Trans>
                        </span>
                        <TokenCreator token={token} />
                    </div>
                </div>
                <div className="mt-[5px] flex flex-col items-start md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-1 truncate">
                        <span className="text-medium font-normal text-lightSecond">
                            <Trans>Trading Fees</Trans>
                        </span>
                        <span className="text-black">${renderShrankPrice(formatPrice(token.fees_usd) ?? '-')}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-1 truncate">
                        <span className="text-medium font-normal text-lightSecond">
                            <Trans>Fee Rate</Trans>
                        </span>
                        <span className="text-black">
                            {isNumber(token.fee_tier) ? leftShift(token.fee_tier, 4).toString() : '-'}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});
