import { evmAddress } from '@lens-protocol/client';
import { fetchAccount } from '@lens-protocol/client/actions';
import { useQuery } from '@tanstack/react-query';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

import { Source } from '@/constants/enum.js';
import { ensureLensResult } from '@/helpers/ensureLensResult.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useSuperFollowModule(profile: Profile | null, disabled = false) {
    const { data, isLoading } = useQuery({
        queryKey: ['original-profile', profile?.profileId],
        staleTime: 1000 * 60 * 2,
        enabled: profile?.source === Source.Lens && !disabled,
        queryFn: () => {
            if (!profile) return;
            return ensureLensResult(fetchAccount(lensSessionHolder.sdk, { address: evmAddress(profile.profileId) }));
        },
    });

    return {
        followModule: (data?.operations?.canFollow.__typename !== 'AccountFollowOperationValidationPassed'
            ? null
            : null) as any, // TODO
        loading: isLoading,
    };
}

export function useSuperFollowData(profile: Profile) {
    const account = useAccount();
    const currentProfile = useCurrentProfile(Source.Lens);

    const { followModule, loading: isProfileLoading } = useSuperFollowModule(profile);

    const followFee = parseFloat(followModule?.amount?.value || '0');
    const feeTokenAddress = followModule?.amount?.asset?.contract.address as Address;

    const { data: { allowanceData, hasAllowance = false } = {}, isLoading: isAllowanceLoading } = useQuery({
        queryKey: ['approved', feeTokenAddress, currentProfile?.profileId],
        enabled: !!feeTokenAddress,
        queryFn: async () => {
            const allowanceData: any = await LensSocialMediaProvider.queryApprovedModuleAllowanceData(
                feeTokenAddress,
                undefined,
                // TODO: FollowModuleType.FeeFollowModule,
            );
            const hasAllowance = parseFloat(allowanceData?.[0]?.allowance.value || '0') > followFee;

            return { allowanceData, hasAllowance };
        },
    });

    const allowanceModule = allowanceData?.[0];

    const { data: balanceData, isLoading: isBalanceLoading } = useReadContract({
        abi: erc20Abi,
        address: feeTokenAddress,
        functionName: 'balanceOf',
        args: [account.address!],
        chainId: followModule?.amount?.asset?.contract.chainId,
    });

    return {
        address: currentProfile?.ownedBy?.address as Address,
        loading: isProfileLoading || isAllowanceLoading || isBalanceLoading,
        followModule,
        isConnected: account.isConnected,
        allowanceModule,
        hasAmount:
            !!balanceData &&
            parseFloat(formatUnits(balanceData, followModule?.amount?.asset?.decimals as number)) > followFee,
        hasAllowance,
    };
}
