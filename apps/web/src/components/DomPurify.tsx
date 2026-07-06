import DOMPurify from 'dompurify';
import { noSSR } from 'foxact/no-ssr';

import { logger } from '@/libs/Logger.js';

// Beyond DOMPurify's default profile: <style> enables CSS-based tricks (e.g.
// exfiltration via background-image, UI redress); <form> and its controls enable
// phishing via a fake login/submit form embedded in third-party article content.
const FORBID_TAGS = ['style', 'form', 'input', 'button', 'select', 'option', 'textarea', 'label', 'fieldset'];

export function sanitizeHtml(html: string) {
    return DOMPurify.sanitize(html, { FORBID_TAGS });
}

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
        const sanitized = sanitizeHtml(html);

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
