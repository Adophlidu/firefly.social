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
    export interface Node {
        children?: Node[];
        [key: string]: any;
    }

    export type TransformFn = (node: Node, index: number, parent: Node | null) => Node[] | null;

    function flatMap(ast: Node, fn: TransformFn): Node[];

    export = flatMap;
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
