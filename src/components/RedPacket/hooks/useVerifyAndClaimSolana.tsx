import { web3 } from '@coral-xyz/anchor';
import { t } from '@lingui/core/macro';
import { isNativeTokenAddress } from '@masknet/web3-shared-solana';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAsyncFn } from 'react-use';

import { queryClient } from '@/configs/queryClient.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { resolveSolanaAccountId } from '@/helpers/resolveSolanaAccountId.js';
import { sharePostAfterClaimed } from '@/helpers/sharePostAfterClaimed.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { type ClaimNativeTokenContext, SolanaRedPacket } from '@/providers/solana/RedPacket.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaimSolana(payload: RedPacketJSONPayload, post: Post, enabled = true) {
    const isNativeToken = isNativeTokenAddress(payload.token?.address);

    const wallet = useWallet();
    const walletModal = useWalletModal();
    const { account } = useChainContext({ networkType: getNetworkTypeFromRpPayload(payload) });

    const [{ loading }, handleClaim] = useAsyncFn(async () => {
        try {
            const accountId = resolveSolanaAccountId(payload.rpid, payload.accountId);

            if (!wallet.publicKey) {
                walletModal.setVisible(true);
                return true;
            }

            if (!payload.token) {
                throw new Error(t`Token is missing`);
            }
            if (!accountId || !payload.password || (!isNativeToken && !payload.tokenProgram)) {
                throw new Error(t`Invalid red packet`);
            }

            const baseParams: ClaimNativeTokenContext = {
                accountId: new web3.PublicKey(accountId),
                claimer: web3.Keypair.fromSecretKey(Uint8Array.from(Buffer.from(payload.password, 'hex'))),
            };

            let result: {
                accountId: web3.PublicKey;
                signature: string;
            } | null = null;
            if (isNativeToken) {
                result = await SolanaRedPacket.claimWithNativeToken({
                    ...baseParams,
                });
            } else {
                result = await SolanaRedPacket.claimWithSplToken({
                    ...baseParams,
                    tokenMint: new web3.PublicKey(payload.token.address),
                    tokenProgram: new web3.PublicKey(payload.tokenProgram || ''),
                });
            }
            if (!result) {
                throw new Error(t`Failed to claim red packet`);
            }

            await queryClient.refetchQueries({
                queryKey: ['red-packet', 'solana-availability', payload.rpid, account],
            });

            const claimedRecord = await SolanaRedPacket.getClaimedRecord(
                new web3.PublicKey(accountId),
                new web3.PublicKey(account),
            );
            const amount = formatBalance(claimedRecord?.amount.toString() || '0', payload.token.decimals);

            sharePostAfterClaimed(post, amount, payload.token.symbol);
            enqueueSuccessMessage(
                amount
                    ? t`Claimed lucky drop with ${amount} ${payload.token?.symbol} successfully`
                    : t`Claimed lucky drop successfully`,
            );

            return true;
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to claim red packet`);
            throw error;
        }
    }, [
        isNativeToken,
        payload.accountId,
        payload.password,
        payload.token,
        payload.rpid,
        post,
        payload.tokenProgram,
        account,
        wallet.publicKey,
        walletModal,
    ]);

    return [
        {
            isVerifying: false,
            isClaiming: loading,
            claimStrategyStatus: undefined,
            recheckClaimStatus: () => Promise.resolve({}),
        },
        handleClaim,
    ] as const;
}
