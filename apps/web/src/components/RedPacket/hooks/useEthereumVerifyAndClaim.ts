import { t } from '@lingui/core/macro';
import { last } from 'lodash-es';
import { useCallback } from 'react';
import type { Address } from 'viem';
import { readContract } from 'wagmi/actions';

import RED_PACKET_ABI from '@/abis/RedPacket.json' with { type: 'json' };
import { useClaimCallback } from '@/components/RedPacket/hooks/useClaimCallback.js';
import { useClaimStrategyStatus } from '@/components/RedPacket/hooks/useClaimStrategyStatus.js';
import { queryClient } from '@/configs/queryClient.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { NetworkType, type SocialSource } from '@/constants/enum.js';
import { enqueueWarningMessage } from '@/helpers/enqueueMessage.js';
import { formatBalance } from '@/helpers/formatBalance.js';
import { usePrivyAppkitAccountByNetwork } from '@/hooks/appkit/usePrivyAppkitAccountByNetwork.js';
import { getRedPacketContractAddress } from '@/providers/ethereum/getRedPacketContract.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import { EVMChainResolver } from '@/web3-providers/evm/ResolverAPI.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

export function useEthereumVerifyAndClaim(payload: RedPacketJSONPayload, source: SocialSource, enabled = true) {
    const appkitAccount = usePrivyAppkitAccountByNetwork(NetworkType.Ethereum);
    const account = appkitAccount.account?.address || '';

    const signedMessage = 'privateKey' in payload ? payload.privateKey : payload.password;
    const {
        data,
        isFetching,
        refetch: recheckClaimStatus,
    } = useClaimStrategyStatus(payload, source, account, enabled && !signedMessage);

    const [{ loading: isClaiming }, claimCallback] = useClaimCallback(source, account ?? '', payload);

    const verifyAndClaim = useCallback(async () => {
        const { data } = await recheckClaimStatus();
        if (!data?.data.canClaim) {
            enqueueWarningMessage(t`Oops... Not all the requirements have been met`);
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
        const chainId =
            (payload.network ? EVMChainResolver.chainId(payload.network) : payload.chainId) ?? EthereumChainId.Mainnet;

        const availability = (await readContract(wagmiConfig, {
            abi: RED_PACKET_ABI,
            functionName: 'check_availability',
            address: getRedPacketContractAddress(chainId),
            args: [payload.rpid],
            account: account as Address,
            chainId,
        })) as [string, bigint, bigint, bigint, boolean, bigint];

        const claimed_amount = last(availability) as bigint;
        const amount = formatBalance(claimed_amount.toString(), payload.token?.decimals, { significant: 2 });

        return { canClaim: true, amount, tx: hash };
    }, [
        account,
        claimCallback,
        payload.rpid,
        payload.token?.decimals,
        payload.chainId,
        recheckClaimStatus,
        source,
        payload.network,
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
