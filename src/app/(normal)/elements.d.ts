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
