declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'mask-page-inspector': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'mask-decrypted-post': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & { props: string },
                HTMLElement
            >;
            'mask-post-inspector': React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement> & { props: string },
                HTMLElement
            >;
        }
    }
}

// https://github.com/remarkjs/react-markdown/issues/877
declare global {
    namespace JSX {
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
export {};
