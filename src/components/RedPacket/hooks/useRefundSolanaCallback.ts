import { web3 } from '@coral-xyz/anchor';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import type { ChainContextOverrides } from '@/hooks/useChainContext.js';
import { getTokenAccountByMint } from '@/providers/solana/getTokenAccountByMint.js';
import { getRedPacket } from '@/providers/solana/red-packet/getRedPacket.js';
import { refundNativeToken } from '@/providers/solana/red-packet/refundNativeToken.js';
import { refundSplToken } from '@/providers/solana/red-packet/refundSplToken.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useRefundSolanaCallback(rpid?: string, overrides?: ChainContextOverrides) {
    const chainId = overrides?.chainId || SolanaChainId.Mainnet;

    return useAsyncFn(async () => {
        if (!rpid) throw new Error('Failed to resolve red packet account id.');

        const rpAccount = new web3.PublicKey(rpid);
        const redPacket = await getRedPacket(rpAccount);
        if (redPacket.tokenType === 0) {
            await refundNativeToken(rpAccount);
        } else {
            const tokenAccount = await getTokenAccountByMint(
                chainId,
                redPacket.creator.toBase58(),
                redPacket.tokenAddress.toBase58(),
            );
            if (!tokenAccount) throw new Error('Failed to get token account.');

            await refundSplToken({
                accountId: rpAccount,
                tokenMint: redPacket.tokenAddress,
                tokenAccount: tokenAccount.pubkey,
                tokenProgram: tokenAccount.owner,
            });
        }

        await queryClient.refetchQueries({
            queryKey: ['red-packet', 'solana-availability', rpid],
        });
    }, [rpid, chainId]);
}
