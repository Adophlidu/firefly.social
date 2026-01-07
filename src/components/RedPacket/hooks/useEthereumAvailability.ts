import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { readContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function useEthereumAvailability(payload: RedPacketJSONPayload, options?: { enabled?: boolean }) {
    const networkType = getNetworkTypeFromRpPayload(payload);
    const enabled = (options?.enabled ?? true) && networkType === NetworkType.Ethereum;
    const { account } = useChainContext({ networkType });
    const chainId = enabled
        ? ((payload.network ? EVMChainResolver.chainId(payload.network) : payload.chainId) ?? EthereumChainId.Mainnet)
        : undefined;
    const version = payload.contract_version;
    const id = payload.rpid;

    return useQuery({
        queryKey: ['red-packet', 'check-availability', chainId, version, id, account],
        enabled,
        queryFn: async () => {
            if (!id) return null;
            const data = await readContract(wagmiConfig, {
                abi: RED_PACKET_ABI,
                functionName: 'check_availability',
                address: getRedPacketContractAddress(chainId ?? EthereumChainId.Mainnet),
                args: [id],
                account: account as Address,
                chainId: chainId ?? EthereumChainId.Mainnet,
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
