import { config as configV3 } from '@tamagui/config/v3';
import { createTamagui, type TamaguiInternalConfig } from 'tamagui';

const lightColors = {
    bg: '#FFFFFF',
    bgSubdued: '#F8F7F9',
    bgHover: '#EDEEF2',
    bgSuccessSubdued: '#DCF1D9',
    bgCriticalSubdued: '#FFE6E4',
    bgDisabled: '#D8D7E1',
    text: '#171717',
    textSubdued: 'rgba(70, 70, 70, 0.8)',
    textDisabled: 'rgba(70, 70, 70, 0.4)',
    textTertiary: '#A9A6BC',
    textSuccess: '#429F37',
    textCritical: '#FF372B',
    border: '#F0F0F0',
    borderSubdued: 'rgba(34, 33, 47, 0.15)',
    accent: '#5E69FF',
    orange: '#F7931A',
};

const darkColors: typeof lightColors = {
    bg: '#171717',
    bgSubdued: '#1E1E1E',
    bgHover: '#252525',
    bgSuccessSubdued: '#1A2D1A',
    bgCriticalSubdued: '#2D1515',
    bgDisabled: '#2E2E36',
    text: '#F0F0F0',
    textSubdued: 'rgba(220, 220, 220, 0.7)',
    textDisabled: 'rgba(220, 220, 220, 0.4)',
    textTertiary: '#6B6B8A',
    textSuccess: '#48AD3C',
    textCritical: '#FF564D',
    border: '#2D2D2D',
    borderSubdued: 'rgba(255, 255, 255, 0.1)',
    accent: '#818BFF',
    orange: '#F7931A',
};

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
