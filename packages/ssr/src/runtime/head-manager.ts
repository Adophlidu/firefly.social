import type { HeadDescriptor, HeadLink, HeadMeta } from './types.ts';

const MANAGED_ATTRIBUTE = 'data-ssr-managed';

/**
 * Flatten a head descriptor chain (root → page) into the effective tag set:
 * the last non-empty title wins, and a later meta/link tag overrides an
 * earlier one with the same identity (mirrors how nested Next.js layouts
 * merge `metadata`). Meta identity: name/property/httpEquiv/charSet; link
 * identity: rel alone for singleton rels (`canonical`), rel + href otherwise
 * (multiple icons with the same rel are all kept).
 */
export function flattenHeads(heads: HeadDescriptor[]): {
    title: string | undefined;
    meta: HeadMeta[];
    links: HeadLink[];
} {
    const title = heads
        .map((head) => head.title)
        .filter(Boolean)
        .at(-1);

    const metaByKey = new Map<string, HeadMeta>();
    const linkByKey = new Map<string, HeadLink>();
    for (const head of heads) {
        for (const meta of head.meta ?? []) {
            const key = meta.name
                ? `name:${meta.name}`
                : meta.property
                  ? `property:${meta.property}`
                  : meta.httpEquiv
                    ? `httpEquiv:${meta.httpEquiv}`
                    : meta.charSet
                      ? 'charSet'
                      : `content:${meta.content}`;
            metaByKey.set(key, meta);
        }
        for (const link of head.links ?? []) {
            const key = link.rel === 'canonical' ? 'canonical' : `${link.rel}|${link.href}`;
            linkByKey.set(key, link);
        }
    }
    return { title, meta: [...metaByKey.values()], links: [...linkByKey.values()] };
}

/**
 * Apply head descriptors to the live document after a client-side
 * navigation: the last non-empty title wins; meta/link tags managed by the
 * router (those rendered by `<HeadOutlet>`, which marks them with
 * `data-ssr-managed`) are replaced as a set.
 */
export function applyHeads(heads: HeadDescriptor[]): void {
    const { title, meta, links } = flattenHeads(heads);
    if (title !== undefined) document.title = title;

    document.head.querySelectorAll(`[${MANAGED_ATTRIBUTE}]`).forEach((element) => element.remove());

    for (const metaTag of meta) {
        const element = document.createElement('meta');
        element.setAttribute(MANAGED_ATTRIBUTE, '');
        for (const [key, value] of Object.entries(metaTag)) {
            if (value === undefined) continue;
            element.setAttribute(key === 'httpEquiv' ? 'http-equiv' : key, value);
        }
        document.head.append(element);
    }
    for (const linkTag of links) {
        const element = document.createElement('link');
        element.setAttribute(MANAGED_ATTRIBUTE, '');
        for (const [key, value] of Object.entries(linkTag)) {
            if (value === undefined) continue;
            element.setAttribute(key === 'crossOrigin' ? 'crossorigin' : key, value);
        }
        document.head.append(element);
    }
}

/** The attribute `<HeadOutlet>` marks its tags with, kept in sync here. */
export const HEAD_MANAGED_ATTRIBUTE = MANAGED_ATTRIBUTE;
