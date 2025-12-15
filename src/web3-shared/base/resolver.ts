import urlcat from 'urlcat';

import { logger } from '@/libs/Logger.js';

// https://stackoverflow.com/a/67176726
const MATCH_IPFS_CID_RAW =
    'Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[2-7A-Za-z]{58,}|B[2-7A-Z]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[\\dA-F]{50,}';
const MATCH_IPFS_DATA_RE = /ipfs\/(data:[\w,/;]+)$/;
const MATCH_IPFS_CID_RE = new RegExp(`(${MATCH_IPFS_CID_RAW})`);
const MATCH_IPFS_CID_AT_STARTS_RE = new RegExp(`^https://(?:${MATCH_IPFS_CID_RAW})`);
const MATCH_IPFS_CID_AND_PATHNAME_RE = new RegExp(`(?:${MATCH_IPFS_CID_RAW})\\/?.*`);
const CORS_HOST = 'https://cors-next.r2d2.to';
const IPFS_GATEWAY_HOST = 'https://ipfs.io';

/**
 * Remove query from IPFS url, as it is not needed
 * and will increase requests sometimes.
 * For example https://ipfs.io/ipfs/<same-cid>?id=67891 and https://ipfs.io/ipfs/<same-cid>?id=67892
 * are set to two different NFTs, but according to the same CID,
 * they are exactly the same.
 */
function trimQuery(url: string) {
    const indexOf = url.indexOf('?');
    return url.slice(0, Math.max(0, indexOf === -1 ? url.length : indexOf));
}

function resolveIPFS_CID(str: string) {
    return str.match(MATCH_IPFS_CID_RE)?.[1];
}

export function resolveIPFS_URL(cidOrURL: string | undefined): string | undefined {
    if (!cidOrURL) return cidOrURL;

    // eliminate cors proxy
    if (cidOrURL.startsWith(CORS_HOST)) {
        return trimQuery(resolveIPFS_URL(decodeURIComponent(cidOrURL.replace(new RegExp(`^${CORS_HOST}??`), '')))!);
    }

    // a ipfs.io host
    if (cidOrURL.startsWith(IPFS_GATEWAY_HOST)) {
        // base64 data string
        const [_, data] = cidOrURL.match(MATCH_IPFS_DATA_RE) ?? [];
        if (data) return decodeURIComponent(data);

        // plain
        return trimQuery(decodeURIComponent(cidOrURL));
    }

    // a ipfs hash fragment
    if (MATCH_IPFS_CID_RE.test(cidOrURL)) {
        // starts with a cid
        if (MATCH_IPFS_CID_AT_STARTS_RE.test(cidOrURL)) {
            try {
                const u = new URL(cidOrURL);
                const cid = resolveIPFS_CID(cidOrURL);

                if (cid) {
                    if (u.pathname === '/') {
                        return resolveIPFS_URL(
                            urlcat('https://ipfs.io/ipfs/:cid', {
                                cid,
                            }),
                        );
                    } else {
                        return resolveIPFS_URL(
                            urlcat('https://ipfs.io/ipfs/:cid/:path', {
                                cid,
                                path: u.pathname.slice(1),
                            }),
                        );
                    }
                }
            } catch (error) {
                logger.error('Resolver error', error);
                // do nothing
            }
        }

        const pathname = cidOrURL.match(MATCH_IPFS_CID_AND_PATHNAME_RE)?.[0];
        if (pathname) return trimQuery(`${IPFS_GATEWAY_HOST}/ipfs/${pathname}`);
    }

    return cidOrURL;
}
