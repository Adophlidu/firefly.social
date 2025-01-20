import { t } from '@lingui/core/macro';
import { unreachable } from '@masknet/kit';
import { useAsyncFn } from 'react-use';

import { useVerifyAndClaimEVM } from '@/components/RedPacket/hooks/useVerifyAndClaimEVM.js';
import { useVerifyAndClaimSolana } from '@/components/RedPacket/hooks/useVerifyAndClaimSolana.js';
import { NetworkType, type SocialSource } from '@/constants/enum.js';
import { enqueueMessageFromError, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { resolveSolanaAccountId } from '@/helpers/resolveSolanaAccountId.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { sharePostAfterClaimed } from '@/helpers/sharePostAfterClaimed.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaim(payload: RedPacketJSONPayload, source: SocialSource, post: Post) {
    const networkType = getNetworkTypeFromRpPayload(payload);
    const symbol = payload.token?.symbol;

    const [evmStatus, claimWithEVM] = useVerifyAndClaimEVM(payload, source, post, networkType === NetworkType.Ethereum);
    const [solanaStatus, claimWithSolana] = useVerifyAndClaimSolana(payload, post, networkType === NetworkType.Solana);

    const [{ loading }, handleClaim] = useAsyncFn(async () => {
        try {
            const result = networkType === NetworkType.Ethereum ? await claimWithEVM() : await claimWithSolana();
            if (!result.canClaim) return false;

            const profile = await getCurrentClaimProfile(source);
            if (result.tx && profile?.profileId && profile.handle) {
                await runInSafeAsync(() =>
                    FireflyRedPacketEndpoint.finishClaiming(
                        resolveSolanaAccountId(payload.rpid),
                        profile.platform,
                        profile.profileId || '',
                        profile.handle || '',
                        result.tx || '',
                    ),
                );
            }

            sharePostAfterClaimed(post, result.amount || '', symbol);
            enqueueSuccessMessage(
                result.amount
                    ? t`Claimed lucky drop with ${result.amount} ${symbol} successfully`
                    : t`Claimed lucky drop successfully`,
            );
            return true;
        } catch (error) {
            enqueueMessageFromError(error, t`Failed to claim red packet`);
            throw error;
        }
    }, [claimWithEVM, claimWithSolana, symbol, post, networkType, payload.rpid, source]);

    switch (networkType) {
        case NetworkType.Solana:
            return [{ ...solanaStatus, isClaiming: solanaStatus.isClaiming || loading }, handleClaim] as const;
        case NetworkType.Ethereum:
            return [{ ...evmStatus, isClaiming: evmStatus.isClaiming || loading }, handleClaim] as const;
        default:
            unreachable(networkType);
    }
}
