import { useAtomValue } from 'jotai';
import type { ComponentProps } from 'react';
import { memo, useMemo } from 'react';
import { Button } from 'tamagui';

import { queryClient } from '@/configs/queryClient';
import { UserActionState } from '@/constants/enum';
import { toast } from '@/helpers/toast';
import { useUserActionState } from '@/hooks/Perps/useUserActionState';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { LoadingIcon } from '@/icons/LoadingIcon';
import { acceptTerms } from '@/services/acceptTerms';
import { walletClientAtom } from '@/store/wallet';

interface Props extends ComponentProps<typeof Button> {
    loading?: boolean;
    loadingSize?: number;
    onPress?: () => void;
}

export const WalletActionButton = memo<Props>(function WalletActionButton({
    onPress,
    loading,
    loadingSize = 20,
    disabled: disabledProp,
    children,
    ...rest
}) {
    const { state, isLoading, address } = useUserActionState();
    const walletClient = useAtomValue(walletClientAtom);

    const buttonLabel = useMemo(() => {
        if (state === UserActionState.CONNECT) {
            return 'Connect';
        }
        if (state === UserActionState.AGREE_LEGAL) {
            return 'Agree Legal';
        }
        if (state === UserActionState.DEPOSIT) {
            return 'Deposit';
        }
        if (state === UserActionState.APPROVE_AGENT) {
            return 'Approve Agent';
        }
        if (state === UserActionState.DISABLED) {
            return 'Unavailable';
        }
        return children;
    }, [state, children]);

    const [{ loading: isExecuting }, execute] = useAsyncFn(async () => {
        if (!walletClient || !address) return;

        if (state === UserActionState.CONNECT) return;
        if (state === UserActionState.AGREE_LEGAL) {
            try {
                await acceptTerms(walletClient, address);
                await queryClient.refetchQueries({
                    queryKey: ['wallet', 'legalCheck', address?.toLowerCase()],
                });
            } catch {
                toast({ message: 'Failed to agree to legal terms. Please try again.', type: 'error' });
                return;
            }
        }

        if (state !== UserActionState.READY) {
            return;
        }

        onPress?.();
    }, [state, walletClient, address, onPress]);

    const disabled = isLoading || loading || isExecuting || disabledProp;

    return (
        <Button onPress={disabled ? undefined : execute} disabled={disabled} opacity={disabled ? 0.5 : 1} {...rest}>
            {loading || isExecuting ? <LoadingIcon size={loadingSize} /> : buttonLabel}
        </Button>
    );
});
