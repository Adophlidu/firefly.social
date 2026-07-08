import DOMPurifyFactory, { type DOMPurify, type WindowLike } from 'dompurify';
import { noSSR } from 'foxact/no-ssr';

import { logger } from '@/libs/Logger.js';

// Beyond DOMPurify's default profile: <style> enables CSS-based tricks (e.g.
// exfiltration via background-image, UI redress); <form> and its controls enable
// phishing via a fake login/submit form embedded in third-party article content.
const FORBID_TAGS = ['style', 'form', 'input', 'button', 'select', 'option', 'textarea', 'label', 'fieldset'];

const SANITIZE_OPTIONS = { FORBID_TAGS };

let domPurify: DOMPurify | undefined;

/** core-js polyfills in /js/polyfills/base.js break DOMPurify on the main document. */
function getDomPurify(): DOMPurify {
    if (domPurify) return domPurify;

    if (typeof document !== 'undefined') {
        const iframe = document.createElement('iframe');
        iframe.hidden = true;
        iframe.setAttribute('aria-hidden', 'true');
        iframe.setAttribute('tabindex', '-1');
        // Kept in the DOM forever by design: removing it would tear down the isolated
        // contentWindow this DOMPurify instance is bound to, reintroducing the polyfill conflict.
        (document.body ?? document.documentElement).appendChild(iframe);

        const isolatedWindow = iframe.contentWindow;
        if (isolatedWindow) {
            domPurify = DOMPurifyFactory(isolatedWindow as unknown as WindowLike);
            return domPurify;
        }
    }

    domPurify = DOMPurifyFactory;
    return domPurify;
}

export function sanitizeHtml(html: string) {
    return getDomPurify().sanitize(html, SANITIZE_OPTIONS);
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
