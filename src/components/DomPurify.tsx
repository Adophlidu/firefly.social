import DOMPurify from 'dompurify';
import { noSSR } from 'foxact/no-ssr';

export function SanitizerDiv(props: React.HTMLProps<HTMLDivElement>) {
    noSSR();
    if (!props.dangerouslySetInnerHTML) {
        return <div {...props} />;
    }
    return (
        <div
            {...props}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(props.dangerouslySetInnerHTML.__html as string) }}
        />
    );
}
