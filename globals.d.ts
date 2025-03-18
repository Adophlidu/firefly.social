/// <reference types="./src/maskbook/packages/encryption/src/internal.d.ts" />
/// <reference types="./src/maskbook/packages/polyfills/types/__all.d.ts" />
/// <reference types="./src/maskbook/packages/polyfills/types/dom.d.ts" />
/// <reference types="./src/maskbook/packages/polyfills/types/firefox.d.ts" />
/// <reference types="./src/maskbook/packages/web3-telemetry/src/env.d.ts" />

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

declare module '*.svg?url' {
    const content: string;
    export default content;
}

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
    }
}

type LiteralUnion<U, T = U extends string ? string : U extends number ? number : never> = U | (T & Nothing);

type HexString = `0x${string}`;
