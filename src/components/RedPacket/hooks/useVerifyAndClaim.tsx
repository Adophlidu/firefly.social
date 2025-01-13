import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { getRedPacketConstant } from '@masknet/web3-shared-evm';
import { last } from 'lodash-es';
import { useCallback } from 'react';
import urlcat from 'urlcat';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { readContract } from 'wagmi/actions';

import CircleSuccessIcon from '@/assets/circle-success.svg';
import { useClaimCallback } from '@/components/RedPacket/hooks/useClaimCallback.js';
import { useClaimStrategyStatus } from '@/components/RedPacket/hooks/useClaimStrategyStatus.js';
import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import type { SocialSource } from '@/constants/enum.js';
import { SITE_URL } from '@/constants/index.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { getPostUrl } from '@/helpers/getPostUrl.js';
import { HappyRedPacketV4ABI } from '@/mask/constants.js';
import { ComposeModalRef, ConfirmModalRef } from '@/modals/controls.js';
import { getCurrentClaimProfile } from '@/providers/ethereum/getCurrentClaimProfile.js';
import { FireflyRedPacketEndpoint } from '@/providers/firefly/RedPacketEndpoint.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';

export function useVerifyAndClaim(payload: RedPacketJSONPayload, source: SocialSource, post: Post) {
    const { address: account } = useAccount();
    const { data, isFetching, refetch: recheckClaimStatus } = useClaimStrategyStatus(payload, source);

    const [{ loading: isClaiming }, claimCallback] = useClaimCallback(account ?? '', payload, source);

    const verifyAndClaim = useCallback(async () => {
        const { data } = await recheckClaimStatus();
        if (!data?.data.canClaim) {
            enqueueErrorMessage(t`Oops... Not all the requirements have been met`);
            return false;
        }

        const currentClaimProfile = await getCurrentClaimProfile(source);

        const hash = await claimCallback();
        if (hash && currentClaimProfile?.profileId && currentClaimProfile.handle) {
            await FireflyRedPacketEndpoint.finishClaiming(
                payload.rpid,
                currentClaimProfile.platform,
                currentClaimProfile.profileId,
                currentClaimProfile.handle,
                hash,
            );
        }

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
        const postUrl = urlcat(SITE_URL, getPostUrl(post));

        ConfirmModalRef.open({
            title: t`Lucky Drop`,
            content: (
                <div className="flex h-[276px] w-[388px] flex-col items-center max-md:w-auto">
                    <CircleSuccessIcon width={90} height={90} />
                    <div className="mt-3 text-xl font-bold leading-6 text-success">
                        <Trans>Congratulations!</Trans>
                    </div>
                    <div className="mt-10 text-base font-bold leading-5 text-main">
                        <Trans>
                            Your claimed {amount} {payload.token?.symbol}.
                        </Trans>
                    </div>
                </div>
            ),
            modalClass: 'md:w-auto',
            enableConfirmButton: true,
            variant: 'normal',
            confirmButtonText: t`Share`,
            onConfirm: () => {
                ComposeModalRef.open({
                    type: 'compose',
                    source,
                    chars: [
                        t`🤑 Just claimed a #FireflyLuckyDrop 🧧💰✨ on ${postUrl} from @${post.author.handle} !`,
                        ' \n\n',
                        t`Claim on ${post.source}:`,
                        ' \n',
                        postUrl,
                    ],
                });
            },
        });

        enqueueSuccessMessage(t`Claimed lucky drop with ${amount} ${payload.token?.symbol} successfully`);
        return true;
    }, [
        post,
        account,
        claimCallback,
        payload.rpid,
        payload.token?.decimals,
        payload.token?.symbol,
        payload.chainId,
        recheckClaimStatus,
        source,
    ]);

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
