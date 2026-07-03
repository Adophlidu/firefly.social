import DOMPurify from 'dompurify';
import { noSSR } from 'foxact/no-ssr';

export function SanitizerDiv(props: React.HTMLProps<HTMLDivElement>) {
    noSSR();
    if (!props.dangerouslySetInnerHTML) {
        return <div {...props} />;
    }

    const html = props.dangerouslySetInnerHTML.__html;
    if (typeof html !== 'string' || html === '') {
        return <div {...props} />;
    }

    return (
        <div
            {...props}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
    );
}
