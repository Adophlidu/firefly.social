import type { ComponentProps } from 'react';
import { Input } from 'tamagui';

type Props = ComponentProps<typeof Input>;

export function UnstyledInput(props: Props) {
    return (
        <Input
            unstyled
            backgroundColor="transparent"
            borderWidth={0}
            paddingVertical={0}
            includeFontPadding={false}
            outlineStyle="none"
            focusStyle={{
                borderWidth: 0,
                outlineWidth: 0,
                outlineStyle: 'none',
                outlineColor: 'transparent',
                boxShadow: 'none',
            }}
            {...props}
        />
    );
}
