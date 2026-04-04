import { useQuery } from '@tanstack/react-query';
import { readContract } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getTokenAbiForWagmi } from '@/helpers/getTokenAbiForWagmi.js';
import { isZeroAddressEthereum } from '@/helpers/isZeroAddress.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';

export function useERC20TokenAllowance(
    address?: `0x${string}`,
    spender?: string,
    overrides?: ChainContextOverrides,
    enabled = true,
) {
    const { account, chainId } = useChainContext(overrides);
    const isNativeToken = isZeroAddressEthereum(address);

    return useQuery({
        enabled: !isNativeToken && enabled,
        queryKey: ['erc20-allowance', address?.toLowerCase(), account?.toLowerCase(), spender?.toLowerCase()],
        queryFn: async () => {
            if (!account || !address || !spender || isNativeToken) return undefined;

            return readContract(wagmiConfig, {
                chainId,
                abi: getTokenAbiForWagmi(chainId, address),
                functionName: 'allowance',
                args: [account as `0x${string}`, spender as `0x${string}`],
                address,
            });
        },
    });
}
