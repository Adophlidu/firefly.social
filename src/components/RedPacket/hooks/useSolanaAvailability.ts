import { BN, web3 } from '@coral-xyz/anchor';
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

            const redPacket = await SolanaRedPacket.getRedPacket(new web3.PublicKey(accountId));
            const claimedRecord = await SolanaRedPacket.getClaimedRecord(
                new web3.PublicKey(accountId),
                new web3.PublicKey(account),
            );
            const isExpired = redPacket.duration.add(redPacket.createTime).muln(1000).ltn(Date.now());
            const isEmpty = redPacket.claimedAmount.gte(redPacket.totalAmount) || redPacket.totalAmount.lte(new BN(0));
            const isClaimed = !!claimedRecord;

            return {
                token_address: redPacket.tokenAddress.toBase58(),
                balance: minus(redPacket.totalAmount.toString(), redPacket.claimedAmount.toString()).toString(),
                total: redPacket.totalAmount.toString(),
                claimed: redPacket.claimedNumber.toString(),
                expired: isExpired,
                isEmpty,
                claimed_amount: redPacket.claimedAmount.toString(),
                publicKey: redPacket.pubkeyForClaimSignature,
                isClaimed,
                hasShares: redPacket.claimedNumber < redPacket.totalNumber,
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
