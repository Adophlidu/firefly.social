import { config as configV3 } from '@tamagui/config/v3';
import { createTamagui, type TamaguiInternalConfig } from 'tamagui';

export const config: TamaguiInternalConfig = createTamagui(configV3);

export type Conf = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends Conf {}
}

export default config;
