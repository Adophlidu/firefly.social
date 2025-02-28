import { web3 } from '@coral-xyz/anchor';
import { t } from '@lingui/core/macro';
import { isNativeTokenAddress } from '@masknet/web3-shared-solana';
import { useAsyncFn } from 'react-use';

import { useClaimStrategyStatus } from '@/components/RedPacket/hooks/useClaimStrategyStatus.js';
import { queryClient } from '@/configs/queryClient.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { resolveSolanaAccountId } from '@/helpers/resolveSolanaAccountId.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { ConnectModalRef } from '@/modals/controls.js';
import { type ClaimNativeTokenContext, SolanaRedPacket } from '@/providers/solana/RedPacket.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaimSolana(payload: RedPacketJSONPayload, post: Post, enabled = true) {
    const isNativeToken = isNativeTokenAddress(payload.token?.address);

    const walletProvider = useSolanaWalletProvider();
    const { account } = useChainContext({ networkType: getNetworkTypeFromRpPayload(payload) });
    const { data, isFetching, refetch: recheckClaimStatus } = useClaimStrategyStatus(payload, post.source, enabled);

    const [{ loading }, handleClaim] = useAsyncFn(async () => {
        const accountId = resolveSolanaAccountId(payload.rpid, payload.accountId);

        if (!walletProvider?.publicKey) {
            ConnectModalRef.open();
            return { canClaim: true };
        }

        if (!payload.token) throw new Error('Token is missing');
        if (!accountId || !payload.password || (!isNativeToken && !payload.tokenProgram))
            throw new Error('Invalid red packet');

        const { data } = await recheckClaimStatus();
        if (data?.data && !data.data.canClaim) {
            const hasRequirements = !!data?.data.claimStrategyStatus.length;
            enqueueErrorMessage(
                hasRequirements
                    ? t`Oops... Not all the requirements have been met`
                    : t`You are not eligible to claim this red packet`,
            );
            return { canClaim: false };
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
        if (!result) throw new Error('Failed to claim red packet');

        await queryClient.refetchQueries({
            queryKey: ['red-packet', 'solana-availability', payload.rpid, account],
        });

        const claimedRecord = await SolanaRedPacket.getClaimedRecord(
            new web3.PublicKey(accountId),
            new web3.PublicKey(account),
        );
        const amount = formatBalance(claimedRecord?.amount.toString() || '0', payload.token.decimals);

        return { canClaim: true, amount, tx: result.signature };
    }, [
        payload.rpid,
        payload.accountId,
        payload.token,
        payload.password,
        payload.tokenProgram,
        walletProvider?.publicKey,
        isNativeToken,
        recheckClaimStatus,
        account,
    ]);

    return [
        {
            isVerifying: isFetching,
            isClaiming: loading,
            claimStrategyStatus: data?.data.claimStrategyStatus,
            recheckClaimStatus,
        },
        handleClaim,
    ] as const;
}
