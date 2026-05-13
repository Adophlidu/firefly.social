import { useAtomValue } from 'jotai';

import { UserActionState } from '@/constants/enum';
import { useUserLegalCheck } from '@/hooks/Perps/useUserLegalCheck';
import { walletAddressAtom } from '@/store/wallet';

export function useUserActionState() {
    const value = useAtomValue(walletAddressAtom);

    const address = value || undefined;
    const { data: legalCheck, isLoading } = useUserLegalCheck(address);

    const disabled = legalCheck?.ipAllowed === false || legalCheck?.userAllowed === false;
    return {
        isLoading,
        address,
        state: !address ? UserActionState.CONNECT : disabled ? UserActionState.DISABLED : UserActionState.READY,
    };
}
