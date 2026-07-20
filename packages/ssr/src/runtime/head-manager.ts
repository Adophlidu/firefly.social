import type { HeadDescriptor } from './types.ts';

const MANAGED_ATTRIBUTE = 'data-ssr-managed';

/**
 * Apply head descriptors to the live document after a client-side
 * navigation: the last non-empty title wins; meta/link tags managed by the
 * router (those rendered by `<HeadOutlet>`, which marks them with
 * `data-ssr-managed`) are replaced as a set.
 */
export function applyHeads(heads: HeadDescriptor[]): void {
    const title = heads.map((head) => head.title).filter(Boolean).at(-1);
    if (title !== undefined) document.title = title;

    document.head.querySelectorAll(`[${MANAGED_ATTRIBUTE}]`).forEach((element) => element.remove());

    for (const head of heads) {
        for (const meta of head.meta ?? []) {
            const element = document.createElement('meta');
            element.setAttribute(MANAGED_ATTRIBUTE, '');
            for (const [key, value] of Object.entries(meta)) {
                if (value === undefined) continue;
                element.setAttribute(key === 'httpEquiv' ? 'http-equiv' : key, value);
            }
            document.head.append(element);
        }
        for (const link of head.links ?? []) {
            const element = document.createElement('link');
            element.setAttribute(MANAGED_ATTRIBUTE, '');
            for (const [key, value] of Object.entries(link)) {
                if (value === undefined) continue;
                element.setAttribute(key === 'crossOrigin' ? 'crossorigin' : key, value);
            }
            document.head.append(element);
        }
    }
}

/** The attribute `<HeadOutlet>` marks its tags with, kept in sync here. */
export const HEAD_MANAGED_ATTRIBUTE = MANAGED_ATTRIBUTE;
