import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { readContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { type EthereumChainId } from '@/web3-shared/evm/types.js';

export function useAvailability(
    id: string,
    version: number,
    options: {
        account: string;
        chainId: EthereumChainId;
    },
    enabled = true,
) {
    const { account, chainId } = options;

    return useQuery({
        queryKey: ['red-packet', 'check-availability', chainId, version, id, account],
        enabled,
        queryFn: async () => {
            if (!id) return null;
            const data = await readContract(wagmiConfig, {
                abi: RED_PACKET_ABI,
                functionName: 'check_availability',
                address: getRedPacketContractAddress(chainId),
                args: [id],
                account: account as Address,
                chainId,
            });

            const [token_address, balance, total, claimed, expired, claimed_amount] = data as [
                string,
                bigint,
                bigint,
                bigint,
                boolean,
                bigint,
            ];
            return {
                token_address,
                balance: balance.toString(),
                total: total.toString(),
                claimed: claimed.toString(),
                expired,
                claimed_amount: claimed_amount.toString(),
            };
        },
        refetchInterval(query) {
            const { data } = query.state;
            if (!data) return 30_000;
            if (data.expired || !data.balance) return false;
            return 30_000;
        },
    });
}
