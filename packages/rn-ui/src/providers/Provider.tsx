import { useColorScheme } from 'react-native';
import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui';

import config from '@/tamagui.config';

export function Provider({ children, defaultTheme = 'light', ...rest }: TamaguiProviderProps) {
    const colorScheme = useColorScheme();
    const theme = defaultTheme || (colorScheme === 'dark' ? 'dark' : 'light');

    return (
        <TamaguiProvider config={config} defaultTheme={theme} {...rest}>
            {children}
        </TamaguiProvider>
    );
}
