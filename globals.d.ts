interface Navigator {
    virtualKeyboard: {
        boundingRect: DOMRect;
        overlaysContent: boolean;
        addEventListener: (type: string, listener: (event: { target: { boundingRect: DOMRect } }) => void) => void;
        removeEventListener: (type: string, listener: (event: { target: { boundingRect: DOMRect } }) => void) => void;
    };
}

namespace React {
    namespace JSX {
        interface IntrinsicElements {
            'w3m-connecting-wc-view': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
            'w3m-all-wallets-view': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
            'w3m-connecting-external-view': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
            'w3m-downloads-view': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
            'w3m-connecting-multi-chain-view': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
        }

        // https://github.com/remarkjs/react-markdown/issues/877
        interface IntrinsicElements {
            a: React.JSX.IntrinsicElements['a'];
            p: React.JSX.IntrinsicElements['p'];
            br: React.JSX.IntrinsicElements['br'];
            ol: React.JSX.IntrinsicElements['ol'];
            img: React.JSX.IntrinsicElements['img'];
            code: React.JSX.IntrinsicElements['code'];
        }
    }
}

declare module 'dompurify' {
    class DOMPurity {
        sanitize: (html: string) => string;
    }

    declare const purity: DOMPurity;
    export default purity;
}

declare module 'dayjs-twitter' {
    import type { PluginFunc } from 'dayjs';

    declare const plugin: PluginFunc;
    export default plugin;

    declare module 'dayjs' {
        interface Dayjs {
            twitter(): string;
        }
    }
}

declare module 'unist-util-flatmap' {
    import type { Link, Root, Text } from 'mdast';

    type Node = Text | Link;

    export type TransformFn = (node: Node, index: number, parent: Node | Root | null) => Node[] | null;

    function flatMap(ast: Root, fn: TransformFn): Node[];

    export = flatMap;
}

declare module 'remark-linkify-regex' {
    import type { Root } from 'mdast';

    function linkifyRegex(regex: RegExp): () => (ast: Root) => Root;
    export = linkifyRegex;
}

declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}

declare module '*.css';

declare module '*.svg?url' {
    const content: string;
    export default content;
}

declare module 'next/font/local' {
    type CssVariable = `--${string}`;
    type Display = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    type NextFont = {
        className: string;
        style: {
            fontFamily: string;
            fontWeight?: number;
            fontStyle?: string;
        };
    };
    type NextFontWithVariable = NextFont & {
        variable: string;
    };
    type LocalFont<T extends CssVariable | undefined = undefined> = {
        src:
            | string
            | Array<{
                  path: string;
                  weight?: string;
                  style?: string;
              }>;
        display?: Display;
        weight?: string;
        style?: string;
        adjustFontFallback?: 'Arial' | 'Times New Roman' | false;
        fallback?: string[];
        preload?: boolean;
        variable?: T;
        declarations?: Array<{
            prop: string;
            value: string;
        }>;
    };

    function localFont<T extends CssVariable | undefined = undefined>(
        options: LocalFont<T>,
    ): T extends undefined ? NextFont : NextFontWithVariable;

    export default localFont;
}
