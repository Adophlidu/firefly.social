declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}

declare module '*.css';

// next/font/google has no package.json in its subpath and no "exports" map, so
// NodeNext module resolution can't find it (see apps/web/globals.d.ts's identical
// shim for next/font/local, which hits the same issue).
declare module 'next/font/google' {
    type CssVariable = `--${string}`;
    interface NextFont {
        className: string;
        style: {
            fontFamily: string;
            fontWeight?: number;
            fontStyle?: string;
        };
    }
    type NextFontWithVariable = NextFont & {
        variable: string;
    };
    interface GoogleFontOptions<T extends CssVariable | undefined = undefined> {
        weight?: string | string[];
        style?: string | string[];
        display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
        variable?: T;
        preload?: boolean;
        subsets?: string[];
        fallback?: string[];
        adjustFontFallback?: boolean;
        declarations?: Array<{ prop: string; value: string }>;
    }
    export function Inter<T extends CssVariable | undefined = undefined>(
        options: GoogleFontOptions<T>,
    ): T extends undefined ? NextFont : NextFontWithVariable;
}
