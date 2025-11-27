interface Options {
    ignoreProtocol?: boolean;
    ignorePort?: boolean;
    ignoreTrailingSlash?: boolean;
    ignoreQueryOrder?: boolean;
    ignoreHash?: boolean;
}

function resolvePort(u: URL) {
    if (u.port) return u.port;
    if (u.protocol === 'http:') return '80';
    if (u.protocol === 'https:') return '443';
    return '';
}
function comparePathname(u1: URL, u2: URL, ignoreTrailingSlash?: boolean) {
    let path1 = u1.pathname;
    let path2 = u2.pathname;

    // Decode URI components to match encoded vs decoded (e.g. %20 vs space)
    try {
        path1 = decodeURIComponent(path1);
        path2 = decodeURIComponent(path2);
    } catch (e) {
        // Fallback if malformed
    }

    if (ignoreTrailingSlash) {
        path1 = path1.replace(/\/+$/, '');
        path2 = path2.replace(/\/+$/, '');
    }
    return path1 === path2;
}
function compareSearch(u1: URL, u2: URL, ignoreQueryOrder?: boolean) {
    let search1 = u1.search;
    let search2 = u2.search;

    if (ignoreQueryOrder) {
        u1.searchParams.sort();
        u2.searchParams.sort();
        search1 = u1.search;
        search2 = u2.search;
    }

    return search1 === search2;
}

export function isSameUrl(
    url1: string,
    url2: string,
    options: Options = {
        ignoreProtocol: false,
        ignorePort: false,
        ignoreTrailingSlash: true,
        ignoreQueryOrder: true,
        ignoreHash: false,
    },
) {
    try {
        const u1String = url1?.trim();
        const u2String = url2?.trim();
        if (!u1String || !u2String) return false;

        const u1 = new URL(u1String);
        const u2 = new URL(u2String);

        const hostMatch = u1.hostname === u2.hostname;
        const protocolMatch = options.ignoreProtocol ? true : u1.protocol === u2.protocol;
        const portMatch = options.ignorePort ? true : resolvePort(u1) === resolvePort(u2);
        const pathMatch = comparePathname(u1, u2, options.ignoreTrailingSlash);
        const searchMatch = compareSearch(u1, u2, options.ignoreQueryOrder);
        const hashMatch = options.ignoreHash ? true : u1.hash === u2.hash;

        return protocolMatch && hostMatch && portMatch && pathMatch && searchMatch && hashMatch;
    } catch {
        return false;
    }
}
