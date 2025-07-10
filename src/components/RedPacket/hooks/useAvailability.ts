import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { readContract } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import { type EthereumChainId, getRedPacketConstant } from '#masknet/web3-shared-evm';
import { getRedPacketContractAbi, getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import { RED_PACKET_CONTRACT_VERSION } from '@/constants/rp.js';

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
            const data = await readContract(config, {
                abi: getRedPacketContractAbi(RED_PACKET_CONTRACT_VERSION),
                functionName: 'check_availability',
                address: getRedPacketContractAddress(chainId, RED_PACKET_CONTRACT_VERSION),
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
