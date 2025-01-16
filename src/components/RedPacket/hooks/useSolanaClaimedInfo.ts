import { web3 } from '@coral-xyz/anchor';
import { useQuery } from '@tanstack/react-query';
import { first, noop } from 'lodash-es';

import { NetworkType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { formatSolanaRedPackets } from '@/helpers/formatSolanaRedPackets.js';
import { resolveSolanaAccountId } from '@/helpers/resolveSolanaAccountId.js';
import { SolanaRedPacket } from '@/providers/solana/RedPacket.js';

export function useSolanaClaimedInfo(rpId: string, address: string, enabled = true) {
    const rpAccountId = resolveSolanaAccountId(rpId);

    const { data } = useQuery({
        enabled: !!rpAccountId && enabled,
        queryKey: ['rp-info', NetworkType.Solana, rpId],
        queryFn: async () => {
            const publicKey = new web3.PublicKey(rpAccountId);
            const redPacket = await SolanaRedPacket.getRedPacket(publicKey);
            const sentList = await formatSolanaRedPackets(
                [
                    {
                        account: redPacket,
                        publicKey,
                    },
                ],
                address,
            );
            const sentInfo = first(sentList);
            const records = await SolanaRedPacket.getClaimedRecords(publicKey);
            const claimList = records.map(({ account }) => ({
                creator: account.claimer.toBase58(),
                claim_platform: [],
                token_amounts: account.amount.toString(),
                token_symbol: sentInfo?.token_symbol || '',
                token_decimal: sentInfo?.token_decimal || 0,
            }));

            return { claimInfo: sentInfo, claimList };
        },
    });

    return {
        claimInfo: data?.claimInfo,
        claimList: data?.claimList || EMPTY_LIST,
        onEndReached: noop,
    };
}
