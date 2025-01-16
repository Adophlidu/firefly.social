import { useEvmClaimedInfo } from '@/components/RedPacket/hooks/useEvmClaimedInfo.js';
import { useSolanaClaimedInfo } from '@/components/RedPacket/hooks/useSolanaClaimedInfo.js';
import { NetworkType } from '@/constants/enum.js';

export function useClaimedInfo(rpid: string, address: string, networkType: NetworkType) {
    const evmClaimedInfo = useEvmClaimedInfo(rpid, networkType === NetworkType.Ethereum);
    const solanaClaimedInfo = useSolanaClaimedInfo(rpid, address, networkType === NetworkType.Solana);

    return networkType === NetworkType.Solana ? solanaClaimedInfo : evmClaimedInfo;
}
