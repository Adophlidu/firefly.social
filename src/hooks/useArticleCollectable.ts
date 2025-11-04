import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { estimateFeesPerGas, getBalance } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { isGreaterThan, multipliedBy, plus, ZERO } from '@/helpers/number.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { type Article } from '@/providers/types/Article.js';
import { EVMChainResolver } from '@/web3-providers/Web3/EVM/apis/ResolverAPI.js';

export function useArticleCollectStatus(article: Article) {
    const account = useAccount();

    return useQuery({
        queryKey: ['article-collect-status', article.platform, article.id],
        queryFn: async () => {
            try {
                if (!account.address) return;
                const data = await fireflyEndpointProvider.getArticleCollectStatus(
                    article.id,
                    account.address,
                    article.platform,
                );

                const balance = await getBalance(wagmiConfig, {
                    address: account.address,
                    chainId: data.chainId,
                });

                const isEIP1559 = EVMChainResolver.isFeatureSupported(data.chainId, 'EIP1559');
                const { gasPrice, maxFeePerGas } = await estimateFeesPerGas(wagmiConfig, {
                    chainId: data.chainId,
                    type: isEIP1559 ? 'eip1559' : 'legacy',
                });

                const gasFeePrice = isEIP1559 ? maxFeePerGas : gasPrice;
                const gasFee = multipliedBy((gasFeePrice ?? ZERO).toString(), data.txData.gasLimit);

                const price = data.mintPrice ? data.mintPrice : ZERO;

                const cost = plus(price, gasFee);

                return {
                    data,
                    isFree: data.gasStatus,
                    gasFee: gasFee.toString(),
                    totalCost: cost.toString(),
                    mintMetadata: data,
                    insufficientBalance: isGreaterThan(cost, balance.value.toString()),
                };
            } catch {
                return;
            }
        },
    });
}
