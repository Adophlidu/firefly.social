import { useSetAtom } from 'jotai';
import type { ComponentProps, ReactNode } from 'react';
import { cloneElement, isValidElement, memo, useMemo } from 'react';
import { Button } from 'tamagui';

import { UserActionState } from '@/constants/enum';
import { useUserActionState } from '@/hooks/Perps/useUserActionState';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { acceptTermsSheetOpenAtom } from '@/store/tradeForm';

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
    const { state, isLoading } = useUserActionState();
    const setAcceptTermsSheetOpen = useSetAtom(acceptTermsSheetOpenAtom);

    const buttonLabel = useMemo(() => {
        let override: string | undefined;
        if (state === UserActionState.CONNECT) override = 'Connect';
        else if (state === UserActionState.AGREE_LEGAL) override = 'Agree Legal';
        else if (state === UserActionState.DEPOSIT) override = 'Deposit';
        else if (state === UserActionState.APPROVE_AGENT) override = 'Approve Agent';
        else if (state === UserActionState.DISABLED) override = 'Unavailable';

        if (override === undefined) return children;
        if (isValidElement<{ children?: ReactNode }>(children)) {
            return cloneElement(children, undefined, override);
        }
        return override;
    }, [state, children]);

    const [{ loading: isExecuting }, execute] = useAsyncFn(async () => {
        if (state === UserActionState.CONNECT) return;
        if (state === UserActionState.AGREE_LEGAL) {
            setAcceptTermsSheetOpen(true);
            return;
        }

        if (state !== UserActionState.READY) {
            return;
        }

        onPress?.();
    }, [state, onPress, setAcceptTermsSheetOpen]);

    const disabled =
        (isLoading || loading || isExecuting || disabledProp) &&
        ![UserActionState.CONNECT, UserActionState.AGREE_LEGAL].includes(state);

    return (
        <Button onPress={disabled ? undefined : execute} disabled={disabled} opacity={disabled ? 0.5 : 1} {...rest}>
            {buttonLabel}
        </Button>
    );
});
