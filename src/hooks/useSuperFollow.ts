import { fetchAccount } from '@lens-protocol/client/actions';
import { useQuery } from '@tanstack/react-query';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

import { Source } from '@/constants/enum.js';
import { NotImplementedError } from '@/constants/error.js';
import { safeEvmAddress } from '@/helpers/safeEvmAddress.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { ensureLensResult } from '@/providers/lens/ensureLensResult.js';
import { lensSessionHolder } from '@/providers/lens/SessionHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function useSuperFollowModule(profile: Profile | null, disabled = false) {
    const { data, isLoading } = useQuery({
        queryKey: ['original-profile', profile?.profileId],
        staleTime: 1000 * 60 * 2,
        enabled: profile?.source === Source.Lens && !disabled,
        queryFn: () => {
            if (!profile) return;
            return ensureLensResult(
                fetchAccount(lensSessionHolder.sdk, { address: safeEvmAddress(profile.profileId) }),
            );
        },
    });

    return {
        followModule:
            data?.operations?.canFollow.__typename !== 'AccountFollowOperationValidationPassed'
                ? ({
                      amount: {
                          value: '0',
                          asset: {
                              contract: {
                                  address: '' as Address,
                                  chainId: 0,
                              },
                              symbol: '',
                              decimals: 0,
                          },
                      },
                  } as const)
                : null,
        loading: isLoading,
    };
}

export function useSuperFollowData(profile: Profile) {
    const account = useAccount();
    const currentProfile = useCurrentProfile(Source.Lens);

    const { followModule, loading: isProfileLoading } = useSuperFollowModule(profile);

    const followFee = Number.parseFloat(followModule?.amount?.value || '0');
    const feeTokenAddress = followModule?.amount?.asset?.contract.address as Address;

    const { data: { allowanceData, hasAllowance = false } = {}, isLoading: isAllowanceLoading } = useQuery({
        queryKey: ['approved', feeTokenAddress, currentProfile?.profileId],
        enabled: !!feeTokenAddress,
        queryFn: async (): Promise<{ allowanceData: any[]; hasAllowance: boolean }> => {
            throw new NotImplementedError(
                'Not implemented: LensSocialMediaProvider.queryApprovedModuleAllowanceData with feeTokenAddress',
            );
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
            Number.parseFloat(formatUnits(balanceData, followModule?.amount?.asset?.decimals ?? 0)) > followFee,
        hasAllowance,
    };
}
