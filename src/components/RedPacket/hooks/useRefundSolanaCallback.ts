import { web3 } from '@coral-xyz/anchor';
import { ChainId } from '@masknet/web3-shared-solana';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import { resolveSolanaAccountId } from '@/helpers/resolveSolanaAccountId.js';
import type { ChainContextOverride } from '@/hooks/useChainContext.js';
import { getTokenAccountByMint } from '@/providers/solana/getTokenAccountByMint.js';
import { SolanaRedPacket } from '@/providers/solana/RedPacket.js';

export function useRefundSolanaCallback(rpid?: string, overrides?: ChainContextOverride) {
    const chainId = overrides?.chainId || ChainId.Mainnet;
    const rpAccountId = rpid ? resolveSolanaAccountId(rpid) : null;

    return useAsyncFn(async () => {
        if (!rpAccountId) throw new Error('Failed to resolve red packet account id.');

        const rpAccount = new web3.PublicKey(rpAccountId);
        const redPacket = await SolanaRedPacket.getRedPacket(rpAccount);
        if (redPacket.tokenType === 0) {
            await SolanaRedPacket.refundNativeToken(rpAccount);
        } else {
            const tokenAccount = await getTokenAccountByMint(
                chainId,
                redPacket.creator.toBase58(),
                redPacket.tokenAddress.toBase58(),
            );
            if (!tokenAccount) throw new Error('Failed to get token account.');

            await SolanaRedPacket.refundSplToken({
                accountId: rpAccount,
                tokenMint: redPacket.tokenAddress,
                tokenAccount: tokenAccount.pubkey,
                tokenProgram: tokenAccount.owner,
            });
        }

        await queryClient.refetchQueries({
            queryKey: ['red-packet', 'solana-availability', rpid],
        });
    }, [rpid, chainId, rpAccountId]);
}
