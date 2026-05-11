import { config as configV3 } from '@tamagui/config/v3';
import { createTamagui, type TamaguiInternalConfig } from 'tamagui';

import { darkColors, lightColors } from '@/../../../packages/rn-ui/src/colors';

export const config: TamaguiInternalConfig = createTamagui({
    ...configV3,
    defaultTheme: 'light',
    themes: {
        ...configV3.themes,
        light: { ...configV3.themes.light, ...lightColors },
        dark: { ...configV3.themes.dark, ...darkColors },
    },
});

export type Conf = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends Conf {}
}

export default config;
