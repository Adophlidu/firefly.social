import { t } from '@lingui/core/macro';
import { getRedPacketConstant } from '@masknet/web3-shared-evm';
import { last } from 'lodash-es';
import { useCallback } from 'react';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';

import { useClaimCallback } from '@/components/RedPacket/hooks/useClaimCallback.js';
import { useClaimStrategyStatus } from '@/components/RedPacket/hooks/useClaimStrategyStatus.js';
import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import type { SocialSource } from '@/constants/enum.js';
import { enqueueErrorMessage } from '@/helpers/enqueueMessage.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaimEVM(payload: RedPacketJSONPayload, source: SocialSource, post: Post, enabled = true) {
    const { address: account } = useAccount();
    const { data, isFetching, refetch: recheckClaimStatus } = useClaimStrategyStatus(payload, source, enabled);

    const [{ loading: isClaiming }, claimCallback] = useClaimCallback(account ?? '', payload, source);

    const verifyAndClaim = useCallback(async () => {
        const { data } = await recheckClaimStatus();
        if (!data?.data.canClaim) {
            enqueueErrorMessage(t`Oops... Not all the requirements have been met`);
            return { canClaim: false };
        }

        const hash = await claimCallback();

        await Promise.allSettled([
            queryClient.refetchQueries({
                queryKey: ['red-packet', 'claim', payload.rpid],
            }),
            queryClient.refetchQueries({
                queryKey: ['red-packet', 'parse', source],
            }),
        ]);

        const availability = (await readContract(config, {
            abi: HappyRedPacketV4ABI,
            functionName: 'check_availability',
            address: getRedPacketConstant(payload.chainId!, 'HAPPY_RED_PACKET_ADDRESS_V4') as Address,
            args: [payload.rpid],
            account: account as Address,
            chainId: payload.chainId,
        })) as [string, bigint, bigint, bigint, boolean, bigint];

        const claimed_amount = last(availability) as bigint;
        const amount = formatBalance(claimed_amount.toString(), payload.token?.decimals, { significant: 2 });

        return { canClaim: true, amount, tx: hash };
    }, [account, claimCallback, payload.rpid, payload.token?.decimals, payload.chainId, recheckClaimStatus, source]);

    return [
        {
            isVerifying: isFetching,
            isClaiming,
            claimStrategyStatus: data?.data.claimStrategyStatus,
            recheckClaimStatus,
        },
        verifyAndClaim,
    ] as const;
}
