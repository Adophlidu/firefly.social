import type { ComponentProps } from 'react';
import { Button } from 'tamagui';

interface ButtonUIProps extends ComponentProps<typeof Button> {}

export function ButtonUI({ disabled, onPress, children, ...rest }: ButtonUIProps) {
    return (
        <Button disabled={disabled} onPress={disabled ? undefined : onPress} opacity={disabled ? 0.5 : 1} {...rest}>
            {children}
        </Button>
    );
}
