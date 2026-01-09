import { web3 } from '@coral-xyz/anchor';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { useClaimStrategyStatus } from '@/components/RedPacket/hooks/useClaimStrategyStatus.js';
import { queryClient } from '@/configs/queryClient.js';
import { NetworkType, type SocialSource } from '@/constants/enum.js';
import { enqueueErrorMessage, enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { isZeroAddressSolana } from '@/helpers/isZeroAddress.js';
import { usePrivyAppkitAccountByNetwork } from '@/hooks/appkit/usePrivyAppkitAccountByNetwork.js';
import { signClaimMessage } from '@/providers/ethereum/signClaimMessage.js';
import { claimWithNativeToken } from '@/providers/solana/red-packet/claimWithNativeToken.js';
import { claimWithSplToken } from '@/providers/solana/red-packet/claimWithSplToken.js';
import { getClaimedRecord } from '@/providers/solana/red-packet/getClaimedRecord.js';
import { type RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useSolanaVerifyAndClaim(payload: RedPacketJSONPayload, source: SocialSource, enabled = true) {
    const isNativeToken = isZeroAddressSolana(payload.token?.address);

    const appkitAccount = usePrivyAppkitAccountByNetwork(NetworkType.Solana);
    const contextChainId = SolanaChainId.Mainnet;
    const account = appkitAccount.account?.address || '';
    const { data, isFetching, refetch: recheckClaimStatus } = useClaimStrategyStatus(payload, source, account, enabled);

    const [{ loading }, handleClaim] = useAsyncFn(async () => {
        const accountId = payload.rpid;

        if (!payload.token) throw new Error('Token is missing');

        const { data } = await recheckClaimStatus();
        if (data?.data && !data.data.canClaim) {
            const hasRequirements = !!data?.data.claimStrategyStatus.length;
            if (hasRequirements) enqueueWarningMessage(t`Oops... Not all the requirements have been met`);
            else enqueueErrorMessage(t`You are not eligible to claim this red packet`);
            return { canClaim: false };
        }

        const signedMessage = await signClaimMessage({
            contextChainId,
            account,
            source,
            payload,
        });
        if (!accountId || !signedMessage) throw new Error('Invalid red packet');

        let result: {
            accountId: web3.PublicKey;
            signature: string;
        } | null = null;
        if (isNativeToken) {
            result = await claimWithNativeToken({
                signedMessage: signedMessage?.signedMessage,
                message: signedMessage?.message,
                publicKey: signedMessage?.publicKey,
                accountId: new web3.PublicKey(accountId),
            });
        } else {
            result = await claimWithSplToken({
                signedMessage: signedMessage?.signedMessage,
                message: signedMessage?.message,
                publicKey: signedMessage?.publicKey,
                accountId: new web3.PublicKey(accountId),
                account,
                chainId: contextChainId,
                tokenAddress: payload.token.address,
                tokenProgram: payload.tokenProgram,
            });
        }
        if (!result) throw new Error('Failed to claim red packet');

        await Promise.allSettled([
            queryClient.refetchQueries({
                queryKey: ['red-packet', 'parse', source],
            }),
            queryClient.refetchQueries({
                queryKey: ['red-packet', 'claim', payload.rpid],
            }),
            queryClient.refetchQueries({
                queryKey: ['red-packet', 'solana-availability', payload.rpid, account],
            }),
        ]);
        const claimedRecord = await getClaimedRecord(new web3.PublicKey(accountId), new web3.PublicKey(account));
        const amount = formatBalance(claimedRecord?.amount.toString() || '0', payload.token.decimals);

        return { canClaim: true, amount, tx: result.signature };
    }, [payload, recheckClaimStatus, contextChainId, account, source, isNativeToken]);

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
