import { Trans } from '@lingui/react/macro';
import { ChainId } from '@masknet/web3-shared-evm';
import { memo } from 'react';
import type { Address } from 'viem';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';

import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { TokenIcon } from '@/components/TokenIcon.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatPrice, renderShrankPrice } from '@/helpers/formatPrice.js';
import { resolveRocketsFunChainId } from '@/helpers/resolveRocketsFunChainId.js';
import { resolveRocketsFunTokenUrl } from '@/helpers/resolveRocketsFunTokenUrl.js';
import type { RocketsFunToken } from '@/providers/types/RocketsFun.js';

interface Props {
    token: RocketsFunToken;
}

export const TokenInList = memo(function TokenInList({ token }: Props) {
    const { data: ensName } = useEnsName({
        address: token.deployer as Address,
        chainId: mainnet.id,
    });
    const { data: avatar } = useEnsAvatar({
        name: ensName ?? undefined,
        chainId: mainnet.id,
    });

    return (
        <div className="flex items-start gap-3 px-4 py-3 hover:bg-bg">
            <div>
                <TokenIcon
                    chainId={resolveRocketsFunChainId(token.chain)}
                    address={token.contractAddress}
                    size={44}
                    badgeSize={18}
                    icon={token.imageUrl}
                />
            </div>
            <div className="flex flex-1 flex-col">
                <div className="flex items-center">
                    <div className="flex-1">
                        <div className="text-lg font-bold">
                            <span className="text-lightMain">{token.name}</span>
                            <span className="ml-1 text-lightSecond">{token.symbol}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-2xl font-bold text-lightMain">
                                ${renderShrankPrice(formatPrice(token.market_cap) ?? '')}
                            </span>
                            <span className="text-medium text-lightSecond">MC</span>
                        </div>
                    </div>
                    <Link
                        className="rounded-lg bg-lightMain p-1.5 px-5 text-medium font-bold text-lightBottom"
                        target="_blank"
                        href={resolveRocketsFunTokenUrl(ChainId.BSC, token.contractAddress)}
                    >
                        <Trans>Swap</Trans>
                    </Link>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex gap-2">
                        <Trans>
                            <span className="text-lightSecond">Price</span>
                            <strong className="text-medium font-bold text-lightMain">
                                ${renderShrankPrice(formatPrice(token.price) ?? '')}
                            </strong>
                        </Trans>
                    </span>
                    <span className="flex items-center gap-2">
                        {avatar ? <Avatar src={avatar!} size={24} alt={ensName || token.deployer || ''} /> : null}
                        <Trans>
                            <span className="text-lightSecond">Created by</span>
                            <strong className="text-medium font-bold text-lightMain" title={ensName ?? token.deployer}>
                                {ensName ?? formatAddress(token.deployer, 4)}
                            </strong>
                        </Trans>
                    </span>
                </div>
            </div>
        </div>
    );
});
