import { unreachable } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { useAsyncFn } from 'react-use';

import { useEthereumVerifyAndClaim } from '@/components/RedPacket/hooks/useEthereumVerifyAndClaim.js';
import { useSolanaVerifyAndClaim } from '@/components/RedPacket/hooks/useSolanaVerifyAndClaim.js';
import { NetworkType, type SocialSource } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { sharePostAfterClaimed } from '@/helpers/sharePostAfterClaimed.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { finishClaiming } from '@/providers/firefly/red-packet/finishClaiming.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaim(payload: RedPacketJSONPayload, source: SocialSource, post: Post) {
    const networkType = getNetworkTypeFromRpPayload(payload);
    const symbol = payload.token?.symbol;

    const isEvm = networkType === NetworkType.Ethereum;
    const [ethereumStatus, claimWithEthereum] = useEthereumVerifyAndClaim(payload, source, isEvm);
    const isSol = networkType === NetworkType.Solana;
    const [solanaStatus, claimWithSolana] = useSolanaVerifyAndClaim(payload, post.source, isSol);

    const [{ loading }, handleClaim] = useAsyncFn(async () => {
        try {
            const result = networkType === NetworkType.Ethereum ? await claimWithEthereum() : await claimWithSolana();
            if (!result.canClaim) return false;

            const profile = await getCurrentClaimProfile(source);
            if (result.tx && profile?.profileId && profile.handle) {
                await runInSafeAsync(() =>
                    finishClaiming(
                        payload.rpid,
                        profile.platform,
                        profile.profileId || '',
                        profile.handle || '',
                        result.tx || '',
                    ),
                );
            }

            sharePostAfterClaimed({
                post,
                amount: result.amount || '',
                symbol,
                networkType,
                chainId: payload.chainId,
                txHash: result.tx,
            });
            enqueueSuccessMessage(
                result.amount && symbol
                    ? t`Claimed lucky drop with ${result.amount} ${symbol} successfully`
                    : t`Claimed lucky drop successfully`,
            );
            return true;
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to claim red packet`);
            throw error;
        }
    }, [networkType, claimWithEthereum, claimWithSolana, source, post, symbol, payload.chainId, payload.rpid]);

    switch (networkType) {
        case NetworkType.Solana:
            return [{ ...solanaStatus, isClaiming: solanaStatus.isClaiming || loading }, handleClaim] as const;
        case NetworkType.Ethereum:
            return [{ ...ethereumStatus, isClaiming: ethereumStatus.isClaiming || loading }, handleClaim] as const;
        default:
            unreachable(networkType);
    }
}
