import { BN, web3 } from '@coral-xyz/anchor';
import { minus } from '@dimensiondev/web3/numbers';
import { useQuery } from '@tanstack/react-query';

import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { getClaimedRecord } from '@/providers/solana/red-packet/getClaimedRecord.js';
import { getRedPacket } from '@/providers/solana/red-packet/getRedPacket.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';

export function useSolanaAvailability(payload: RedPacketJSONPayload, options?: { enabled?: boolean }) {
    const networkType = getNetworkTypeFromRpPayload(payload);
    const enabled = (options?.enabled ?? true) && networkType === NetworkType.Solana;
    const { account } = useChainContext({ networkType });

    return useQuery({
        queryKey: ['red-packet', 'solana-availability', payload.rpid, account],
        enabled,
        queryFn: async () => {
            try {
                const accountId = payload.rpid;

                const redPacket = await getRedPacket(new web3.PublicKey(accountId));
                const claimedRecord = account
                    ? await getClaimedRecord(new web3.PublicKey(accountId), new web3.PublicKey(account))
                    : null;

                const isExpired = redPacket.duration.add(redPacket.createTime).muln(1000).lt(new BN(Date.now()));
                const isEmpty =
                    redPacket.claimedAmount.gte(redPacket.totalAmount) || redPacket.totalAmount.lte(new BN(0));
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
            } catch (error) {
                return {
                    balance: '0',
                    total: '0',
                    claimed: '0',
                    expired: false,
                    isEmpty: true,
                    claimed_amount: '0',
                    publicKey: '',
                    isClaimed: false,
                    hasShares: false,
                    isRefunded:
                        error instanceof Error && error.message.includes('Account does not exist or has no data'),
                };
            }
        },
        refetchInterval(query) {
            const { data } = query.state;
            if (!data) return 30_000;
            if (data.expired || !data.balance) return false;
            return 30_000;
        },
    });
}
