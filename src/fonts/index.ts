// @ts-ignore skip
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

export type NextFont = {
    className: string;
    style: {
        fontFamily: string;
        fontWeight?: number;
        fontStyle?: string;
    };
};
export type NextFontWithVariable = NextFont & {
    variable: string;
};

export const inter: NextFontWithVariable = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const bedStead: NextFontWithVariable = localFont({
    src: [
        {
            path: './bedStead/bedstead.otf',
            weight: '400',
            style: 'normal',
        },
        {
            path: './bedStead/bedstead-bold.otf',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--font-bedstead',
    display: 'swap',
});

export const levelUp: NextFontWithVariable = localFont({
    src: './levelUp/level-up.otf',
    variable: '--font-level-up',
    display: 'swap',
});
