import { useEthereumAvailabilityComputed } from '@/components/RedPacket/hooks/useEthereumAvailabilityComputed.js';
import { useSolanaAvailabilityComputed } from '@/components/RedPacket/hooks/useSolanaAvailabilityComputed.js';
import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { unreachable } from '@/helpers/unreachable.js';
import { EVMNetworkResolver, SolanaNetworkResolver } from '@/mask/index.js';
import { type RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { EthereumChainId, EthereumNetworkType } from '#masknet/web3-shared-evm';
import { SolanaChainId, SolanaNetworkType } from '#masknet/web3-shared-solana';

/**
 * Fetch the red packet info from the chain
 * @param payload
 */
export function useAvailabilityComputed(payload: RedPacketJSONPayload, post: Post) {
    const payloadChainId = payload.token?.chainId as number | undefined;
    const networkType = getNetworkTypeFromRpPayload(payload);

    const evmChainId =
        payloadChainId ??
        (payload.network
            ? EVMNetworkResolver.networkChainId(payload.network as EthereumNetworkType) || EthereumChainId.Mainnet
            : EthereumChainId.Mainnet);
    const solanaChainId =
        payloadChainId ??
        (payload.network
            ? SolanaNetworkResolver.networkChainId(payload.network as SolanaNetworkType) || SolanaChainId.Mainnet
            : SolanaChainId.Mainnet);

    const evmAvailability = useEthereumAvailabilityComputed(
        { ...payload, chainId: evmChainId },
        post,
        networkType === NetworkType.Ethereum,
    );
    const solanaAvailability = useSolanaAvailabilityComputed(
        { ...payload, chainId: solanaChainId },
        post,
        networkType === NetworkType.Solana,
    );

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                ...evmAvailability,
                parsedChainId: evmChainId,
            };
        case NetworkType.Solana:
            return {
                ...solanaAvailability,
                isBlacklist: false,
                parsedChainId: solanaChainId,
            };
        default:
            unreachable(networkType);
    }
}
