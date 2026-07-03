import DOMPurify from 'dompurify';
import { noSSR } from 'foxact/no-ssr';

import { logger } from '@/libs/Logger.js';

export function SanitizerDiv(props: React.HTMLProps<HTMLDivElement>) {
    noSSR();
    if (!props.dangerouslySetInnerHTML) {
        return <div {...props} />;
    }

    const html = props.dangerouslySetInnerHTML.__html;
    if (typeof html !== 'string' || html === '') {
        return <div {...props} />;
    }

    // DOMPurify can throw on malformed/clobbered markup; fail safe instead of crashing render.
    try {
        const sanitized = DOMPurify.sanitize(html);

        return (
            <div
                {...props}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitized }}
            />
        );
    } catch (error) {
        logger.error(`Failed to sanitize HTML, ${error}`);

        const { dangerouslySetInnerHTML: _, ...rest } = props;
        return <div {...rest} />;
    }
}
