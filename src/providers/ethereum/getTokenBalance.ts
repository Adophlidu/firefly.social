import { type Address } from 'viem';

import { queryClient } from '@/configs/queryClient.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type { Token } from '@/providers/types/Transfer.js';
import type { EthereumChainId } from '#masknet/web3-shared-evm';

export async function getDebankTokenBalance(
    token: Pick<Token<EthereumChainId, Address>, 'id' | 'chain' | 'decimals' | 'symbol'>,
    account: Address,
) {
    const tokens = await queryClient.ensureQueryData({
        queryKey: ['debank', 'tokens', account],
        queryFn: () => FireflyEndpointProvider.getAllTokenList(account),
        staleTime: 1000 * 60 * 1,
    });

    const currentToken = tokens.find((t) => t.id === token.id && t.chain === token.chain);

    return {
        value: currentToken?.raw_amount ? BigInt(currentToken.raw_amount) : 0n,
        decimals: token.decimals,
        symbol: token.symbol,
    };
}
