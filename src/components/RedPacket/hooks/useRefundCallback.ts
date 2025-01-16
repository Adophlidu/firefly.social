import { useRefundEvmCallback } from '@/components/RedPacket/hooks/useRefundEvmCallback.js';
import { useRefundSolanaCallback } from '@/components/RedPacket/hooks/useRefundSolanaCallback.js';
import { NetworkType } from '@/constants/enum.js';
import { type ChainContextOverride } from '@/hooks/useChainContext.js';

export function useRefundCallback(rpid?: string, overrides?: ChainContextOverride) {
    const refundEVM = useRefundEvmCallback(rpid, overrides);
    const refundSolana = useRefundSolanaCallback(rpid, overrides);

    return overrides?.networkType === NetworkType.Solana ? refundSolana : refundEVM;
}
