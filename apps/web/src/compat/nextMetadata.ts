import type { HeadDescriptor, HeadLink, HeadMeta } from '@dimensiondev/ssr';

/**
 * Structural subset of Next.js' `Metadata` used by this repo's metadata
 * helpers, defined locally now that the `next` package is gone.
 */
export interface Metadata {
    metadataBase?: URL | null;
    title?: string | { absolute?: string; default?: string; template?: string } | null;
    description?: string | null;
    openGraph?: {
        title?: Metadata['title'];
        description?: string | null;
        siteName?: string;
        url?: string | URL;
        type?: string;
        images?: unknown;
        audio?: unknown;
        videos?: unknown;
    } | null;
    twitter?: {
        card?: string;
        title?: Metadata['title'];
        description?: string | null;
        creator?: string;
        images?: unknown;
    } | null;
    robots?: string | { index?: boolean; follow?: boolean } | null;
    itunes?: { appId?: string };
    alternates?: { canonical?: string };
    manifest?: string;
    icons?: unknown;
    [key: string]: unknown;
}

type OgImage = string | URL | { url: string | URL; alt?: string };

function imageUrl(image: OgImage | undefined): string | undefined {
    if (!image) return undefined;
    if (typeof image === 'string') return image;
    if (image instanceof URL) return image.toString();
    return typeof image.url === 'string' ? image.url : image.url.toString();
}

function resolveTitle(title: Metadata['title']): string | undefined {
    if (!title) return undefined;
    if (typeof title === 'string') return title;
    if ('absolute' in title && title.absolute) return title.absolute;
    if ('default' in title) return title.default || undefined;
    return undefined;
}

/**
 * Convert a Next.js `Metadata` object (the shape every `get*PageMetadata`
 * helper returns) into the SSR library's `HeadDescriptor`. Route `head()`
 * functions in the new app await their legacy async metadata getter and pass
 * the result through this adapter.
 */
export function fromNextMetadata(metadata: Metadata): HeadDescriptor {
    const meta: HeadMeta[] = [];
    const links: HeadLink[] = [];

    const title = resolveTitle(metadata.title);
    if (typeof metadata.description === 'string') {
        meta.push({ name: 'description', content: metadata.description });
    }

    const og = metadata.openGraph;
    if (og) {
        const ogTitle = resolveTitle(og.title) ?? title;
        if (ogTitle) meta.push({ property: 'og:title', content: ogTitle });
        if (typeof og.description === 'string') meta.push({ property: 'og:description', content: og.description });
        if (og.siteName) meta.push({ property: 'og:site_name', content: og.siteName });
        if (og.url) meta.push({ property: 'og:url', content: String(og.url) });
        if ('type' in og && og.type) meta.push({ property: 'og:type', content: og.type });
        const ogImages = Array.isArray(og.images) ? og.images : og.images ? [og.images] : [];
        for (const image of ogImages) {
            const url = imageUrl(image as OgImage);
            if (url) meta.push({ property: 'og:image', content: url });
        }

        const ogAudios = Array.isArray(og.audio) ? og.audio : og.audio ? [og.audio] : [];
        for (const audio of ogAudios) {
            const url = imageUrl(audio as OgImage);
            if (url) meta.push({ property: 'og:audio', content: url });
        }

        const ogVideos = Array.isArray(og.videos) ? og.videos : og.videos ? [og.videos] : [];
        for (const video of ogVideos) {
            const url = imageUrl(video as OgImage);
            if (url) meta.push({ property: 'og:video', content: url });
        }
    }

    const twitter = metadata.twitter;
    if (twitter) {
        if ('card' in twitter && twitter.card) meta.push({ name: 'twitter:card', content: twitter.card });
        const twitterTitle = resolveTitle(twitter.title) ?? title;
        if (twitterTitle) meta.push({ name: 'twitter:title', content: twitterTitle });
        if (typeof twitter.description === 'string') {
            meta.push({ name: 'twitter:description', content: twitter.description });
        }
        if (twitter.creator) meta.push({ name: 'twitter:creator', content: twitter.creator });
        const twitterImages = Array.isArray(twitter.images) ? twitter.images : twitter.images ? [twitter.images] : [];
        for (const image of twitterImages) {
            const url = imageUrl(image as OgImage);
            if (url) meta.push({ name: 'twitter:image', content: url });
        }
    }

    const robots = metadata.robots;
    if (typeof robots === 'string') {
        meta.push({ name: 'robots', content: robots });
    } else if (robots && typeof robots === 'object') {
        const parts = [
            robots.index === false ? 'noindex' : undefined,
            robots.follow === false ? 'nofollow' : robots.follow ? 'follow' : undefined,
        ].filter((part): part is string => Boolean(part));
        if (parts.length) meta.push({ name: 'robots', content: parts.join(', ') });
    }

    if (metadata.itunes?.appId) meta.push({ name: 'itunes:app_id', content: metadata.itunes.appId });

    const canonical = metadata.alternates?.canonical;
    if (typeof canonical === 'string') links.push({ rel: 'canonical', href: canonical });

    if (typeof metadata.manifest === 'string') links.push({ rel: 'manifest', href: metadata.manifest });

    const icons = Array.isArray(metadata.icons) ? metadata.icons : metadata.icons ? [metadata.icons] : [];
    for (const icon of icons) {
        if (typeof icon === 'string' || icon instanceof URL) {
            links.push({ rel: 'icon', href: String(icon) });
            continue;
        }
        if (!icon || typeof icon !== 'object' || !('url' in icon) || !icon.url) continue;
        links.push({
            rel: 'rel' in icon && icon.rel ? icon.rel : 'icon',
            href: String(icon.url),
            type: 'type' in icon ? icon.type : undefined,
        });
    }

    return { title, meta, links };
}
