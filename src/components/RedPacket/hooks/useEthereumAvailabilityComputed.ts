import { type QueryObserverResult, type RefetchOptions, useQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { useCallback } from 'react';

import { useAvailability } from '@/components/RedPacket/hooks/useAvailability.js';
import { useCheckSponsorableGasFee } from '@/components/RedPacket/hooks/useCheckSponsorableGasFee.js';
import { useClaimStrategyStatus } from '@/components/RedPacket/hooks/useClaimStrategyStatus.js';
import { useParseRedPacket } from '@/components/RedPacket/hooks/useParseRedPacket.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useChainContext } from '@/hooks/useChainContext.js';
import { signClaimMessage } from '@/providers/ethereum/signClaimMessage.js';
import { type RedPacketJSONPayload, RedPacketStatus } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

/**
 * Fetch the red packet info from the chain
 * @param payload
 */
export function useEthereumAvailabilityComputed(payload: RedPacketJSONPayload, post: Post, enabled = true) {
    const chainId = payload.chainId || EthereumChainId.Mainnet;
    const { account } = useChainContext({
        chainId,
        networkType: getNetworkTypeFromRpPayload(payload),
    });

    const { data: availability, refetch: recheckAvailability } = useAvailability(
        payload.rpid,
        payload.contract_version,
        {
            account,
            chainId,
        },
        enabled,
    );

    const { parsed } = useParseRedPacket(post.source, post, enabled);

    const checkAvailability = recheckAvailability as (
        options?: RefetchOptions,
    ) => Promise<QueryObserverResult<typeof availability>>;

    const { data: password } = useQuery({
        queryKey: ['red-packet', 'signed-message', account, post.source, payload],
        enabled,
        queryFn: async () => {
            const signed = await signClaimMessage({
                account,
                contextChainId: chainId,
                source: post.source,
                payload,
            });
            return signed;
        },
    });

    const signedMessage = 'privateKey' in payload ? payload.privateKey : payload.password;
    const { data, refetch, isFetching, isLoading } = useClaimStrategyStatus(
        payload,
        post.source,
        enabled && !signedMessage,
    );

    const recheckClaimStatus = useCallback(async () => {
        const { data } = await refetch();
        return data?.data?.canClaim;
    }, [refetch]);

    const { data: isSponsorable = false } = useCheckSponsorableGasFee(chainId, account, enabled);

    const redpacket = parsed?.redpacket;
    if (!availability || (!payload.password && !data))
        return {
            chainId,
            isEmpty: !!redpacket?.isEmpty,
            isClaimed: !!redpacket?.isClaimed || !!redpacket?.isFireflyClaimed,
            isExpired: !!redpacket?.isExpired,
            isBlacklist: !!redpacket?.isBlacklist,
            isSponsorable,
            availability,
            checkAvailability,
            payload,
            claimStrategyStatus: null,
            checkingClaimStatus: isFetching,
            recheckClaimStatus,
            password,
            checkStrategyData: {
                data,
                refetch,
                isFetching,
                isLoading,
            },
            computed: {
                canClaim: !!data?.data?.canClaim,
                canRefund: false,
                listOfStatus: EMPTY_LIST as RedPacketStatus[],
            },
        };
    const isEmpty = availability.balance === '0';
    const isExpired = availability.expired;
    const isClaimed = redpacket?.isClaimed || redpacket?.isFireflyClaimed || availability.claimed_amount !== '0';
    const isRefunded = isEmpty && availability.claimed < availability.total;
    const isCreator = isSameEthereumAddress(payload?.sender.address ?? '', account);
    const isPasswordValid = !!(password && password !== 'PASSWORD INVALID');
    // For a central RedPacket, we don't need to check about if the password is valid
    const canClaimByContract = !isExpired && !isEmpty && !isClaimed;
    const canClaim = payload.password ? canClaimByContract && isPasswordValid : canClaimByContract;

    return {
        chainId,
        isClaimed,
        isEmpty,
        isSponsorable,
        isExpired,
        isBlacklist: redpacket?.isBlacklist,
        availability,
        checkAvailability,
        claimStrategyStatus: data?.data,
        recheckClaimStatus,
        checkingClaimStatus: isFetching,
        password,
        computed: {
            canClaim,
            canRefund: isExpired && !isEmpty && isCreator,
            canSend: !isEmpty && !isExpired && !isRefunded && isCreator,
            isPasswordValid,
            listOfStatus: compact([
                isClaimed ? RedPacketStatus.claimed : undefined,
                isEmpty ? RedPacketStatus.empty : undefined,
                isRefunded ? isCreator && RedPacketStatus.refunded : undefined,
                isExpired ? RedPacketStatus.expired : undefined,
            ]),
        },
    };
}
