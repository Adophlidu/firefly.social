const cloudflare = /https:\/\/imagedelivery\.net\/\w+\/[\w-]+\/original/;
const imgur = /https:\/\/i\.imgur\.com\/[a-zA-Z0-9]+?(?:(?![tmlhsb])[a-zA-Z0-9])\.(?:jpg|png)/;
const coinGecko = /https:\/\/coin-images\.coingecko\.com\/coins\/images\/(\d+)\/large\/(.+)/;

/**
 * Return a possibly optimized CDN URL. The returned URL may failed to load.
 *
 * CloudFlare requires enabling Image Transformation in the dashboard, otherwise it will return 403.
 *
 * Any component using this function must have a fallback mechanism.
 *
 * `dpr` (device pixel ratio) is hardcoded to `2` by default to target the retina screens that are
 * common today. It is a constant rather than read from `window`, so the returned URL is identical on
 * the server and the client — reading `window.devicePixelRatio` at render time instead baked a
 * server/client difference into `src` and triggered a React hydration mismatch. Pass an explicit
 * `dpr` to override.
 */
// Note: numbers here are doubled in case user are using DPI 2x screen which is very common these days.

// Note2: Client hints (SEC-CH-DPR and SEC-CH-Width) are supported by some CDN, but Chrome is not sending it even enabled via Accept-CH header (Mar 2026)
// https://developers.cloudflare.com/images/transform-images/make-responsive-images/#client-hints
// (Note: CloudFlare only provide 320 as minimal, but we may use 16.)
// https://imagekit.io/docs/image-transformation#client-hints
export function optimizeCDNImageSize(url: string, width: number, height = width, dpr = 2) {
    // CloudFlare: https://developers.cloudflare.com/images/transform-images/
    if (cloudflare.test(url)) {
        // when the image is too small, the result is very blurry.
        if (width < 100 || height < 100) {
            return url.replace(/original$/, `w=${width * dpr},h=${height * dpr},sharpen=3,onerror=redirect`);
        }
        return url.replace(/original$/, `w=${width * dpr},h=${height * dpr},onerror=redirect`);
    }
    /**
     * Imgur: https://www.reddit.com/r/YouShouldKnow/comments/2r6fyo/ysk_that_adding_a_lowercase_l_before_the_jpg_in/
     *  https://i.imgur.com/YdMTSmd.jpg <--Original, As Uploaded
     *  https://i.imgur.com/YdMTSmdt.jpg <--Tiny Thumbnail, Original Aspect Ratio, the max side will be 160px
     *  https://i.imgur.com/YdMTSmdm.jpg <--Medium, Original Aspect Ratio, the max side will be 320px
     *  https://i.imgur.com/YdMTSmdl.jpg <--Large, Original Aspect Ratio, the max side will be 640px
     *  https://i.imgur.com/YdMTSmdh.jpg <--Huge, Original Aspect Ratio, the max side will be 1024px
     *  https://i.imgur.com/YdMTSmds.jpg <--Small, Square-Cropped, 90x90 px
     *  https://i.imgur.com/YdMTSmdb.jpg <--Big, Square-Cropped, 160x160 px
     */
    if (imgur.test(url)) {
        if (width <= 90 / dpr && height <= 90 / dpr && width === height) {
            return url.replace(/(\.[^.]+)$/, 's$1');
        }
        if (width <= 160 / dpr && height <= 160 / dpr && width === height) {
            return url.replace(/(\.[^.]+)$/, 'b$1');
        }
        if (width <= 320 / dpr && height <= 320 / dpr) {
            return url.replace(/(\.[^.]+)$/, 'm$1');
        }
        if (width <= 640 / dpr && height <= 640 / dpr) {
            return url.replace(/(\.[^.]+)$/, 'l$1');
        }
        if (width <= 1024 / dpr && height <= 1024 / dpr) {
            return url.replace(/(\.[^.]+)$/, 'h$1');
        }
    }
    // Bluesky: https://github.com/bluesky-social/atproto/blob/b9616f63bfa5bd7e30c175b1c6e9a052dc6c92ca/packages/bsky/src/image/uri.ts#L72-L100
    // Not worth to optimize. Their smallest "avatar" preset has 1000x1000, which is too large.

    // Imagekit: https://imagekit.io/docs/image-transformation
    if (url.startsWith('https://ik.imagekit.io/')) {
        // https://ik.imagekit.io/username/img-id.png
        // https://ik.imagekit.io/username/namespace/img-id.png
        // https://ik.imagekit.io/username/namespace/tr:w-auto/img-id.png
        // https://ik.imagekit.io/username/tr:w-auto/img-id.png
        const s = url.split('/');
        let added;
        for (let index = 3; index < s.length; index += 1) {
            const element = s[index];
            if (element.startsWith('tr:')) {
                if (element.match(/^tr:w-\d+,h-\d+$/)) {
                    s[index] = `tr:w-${width},h-${height},c-at_max,dpr-${dpr}`;
                    added = 1;
                } else return url; // do not break existing unknown transformations
            }
        }

        if (!added) {
            s.splice(s.length - 1, 0, `tr:w-${width},h-${height},c-at_max,dpr-${dpr}`);
        }
        return s.join('/');
    }
    // stamp.firefly.land supports `s=` on all endpoints: /avatar/*, /logo/*
    if (url.startsWith('https://stamp.firefly.land/')) {
        const u = new URL(url);
        u.searchParams.set('s', `${width * dpr}`);
        return u.toString();
    }
    if (url.startsWith('https://ipfs.decentralized-content.com/ipfs/')) {
        // https://quicknode.myfilebase.com/ipfs/<cid>?img-width=300&img-height=300&img-dpr=2
        const u = new URL(url);
        u.host = 'quicknode.myfilebase.com';
        u.searchParams.set('img-width', `${width}`);
        u.searchParams.set('img-height', `${height}`);
        u.searchParams.set('img-dpr', `${dpr}`);
        return u.toString();
    }
    // https://media.orbapi.xyz/thumbnailDimension768/<url>
    if (url.startsWith('https://media.orbapi.xyz/thumbnailDimension')) {
        const u = new URL(url);
        const dimension = Math.max(width, height) * dpr;
        u.pathname = `/thumbnailDimension${dimension}${u.pathname.replace(/\/thumbnailDimension\d+/, '')}`;
        return u.toString();
    }
    // 	https://coin-images.coingecko.com/coins/images/<id>/large/LOGOMARK.png?<timestamp>
    if (url.match(coinGecko)) {
        if (width < 100 && height < 100) {
            const [, id, filename] = url.match(coinGecko)!;
            return `https://coin-images.coingecko.com/coins/images/${id}/small/${filename}?${Date.now()}`;
        }
        return url;
    }
    return url;
}
