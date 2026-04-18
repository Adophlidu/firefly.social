import { web3 } from '@coral-xyz/anchor';
import { solana } from '@dimensiondev/web3/chains';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { getTokenAccountByMint } from '@/providers/solana/getTokenAccountByMint.js';
import { getRedPacket } from '@/providers/solana/red-packet/getRedPacket.js';
import { refundNativeToken } from '@/providers/solana/red-packet/refundNativeToken.js';
import { refundSplToken } from '@/providers/solana/red-packet/refundSplToken.js';

export function useRefundSolanaCallback(rpid?: string, overrides?: ChainContextOverrides) {
    const { account } = useChainContext(overrides);
    const chainId = overrides?.chainId || solana.id;

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

        queryClient.setQueryData(['red-packet', 'solana-availability', rpid, account], (oldData: any) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                isEmpty: true,
                balance: '0',
            };
        });
    }, [rpid, chainId]);
}
