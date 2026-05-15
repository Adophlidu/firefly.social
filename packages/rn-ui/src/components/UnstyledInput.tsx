import type { ComponentProps } from 'react';
import { Platform } from 'react-native';
import { Input } from 'tamagui';

type Props = ComponentProps<typeof Input>;

export function UnstyledInput(props: Props) {
    return (
        <Input
            unstyled
            backgroundColor="transparent"
            borderWidth={0}
            padding={0}
            includeFontPadding={false}
            outlineStyle="none"
            focusStyle={
                Platform.OS === 'web'
                    ? {
                          borderWidth: 0,
                          outlineWidth: 0,
                          outlineStyle: 'none',
                          outlineColor: 'transparent',
                          boxShadow: 'none',
                      }
                    : undefined
            }
            {...props}
        />
    );
}
