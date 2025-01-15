import { web3 } from '@coral-xyz/anchor';
import { isSameAddress } from '@masknet/web3-shared-base';
import { useQuery } from '@tanstack/react-query';

import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { minus } from '@/helpers/number.js';
import { resolveSolanaAccountId } from '@/helpers/resolveSolanaAccountId.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { SolanaRedPacket } from '@/providers/solana/RedPacket.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useSolanaAvailability(payload: RedPacketJSONPayload, chainId: number, enabled = true) {
    const { account } = useChainContext({ networkType: getNetworkTypeFromRpPayload(payload) });

    return useQuery({
        queryKey: ['red-packet', 'solana-availability', payload.rpid, account],
        enabled: enabled && !!account,
        queryFn: async () => {
            const accountId = resolveSolanaAccountId(payload.rpid, payload.accountId);
            if (!accountId) return null;

            const data = await SolanaRedPacket.getRedPacket(new web3.PublicKey(accountId));
            const isExpired = data.duration.add(data.createTime).muln(1000).ltn(Date.now());
            const isEmpty = data.claimedAmount.gt(data.totalAmount);
            const isClaimed = data.claimedUsers.some((claimedKey) => isSameAddress(claimedKey.toBase58(), account));

            return {
                token_address: data.tokenAddress.toBase58(),
                balance: minus(data.totalAmount.toString(), data.claimedAmount.toString()).toString(),
                total: data.totalAmount.toString(),
                claimed: data.claimedNumber.toString(),
                expired: isExpired,
                isEmpty,
                claimed_amount: data.claimedAmount.toString(),
                publicKey: data.pubkeyForClaimSignature,
                isClaimed,
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
