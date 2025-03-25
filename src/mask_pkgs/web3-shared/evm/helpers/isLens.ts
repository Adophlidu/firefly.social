const NORMAL_COLLECT_RE = /\.lens-Collect-\d+$/;
const ADMIN_COLLECT_RE = /^lensprotocol-Collect-\d+$/;

const NORMAL_COMMENT_RE = /^Comment by @.*\.lens$/;
const ADMIN_COMMENT_RE = /^Comment by @lensprotocol$/;
// May be not `quoted` comment but something else
const QUOTED_COMMENT_RE = /^Comment by @\w+$/;

const NORMAL_POST_RE = /^Post by @.*\.lens$/;
const ADMIN_POST_RE = /^Post by @lensprotocol$/;
const GENESIS_POST_RE = /Genesis post - \w+.lens/;
// May be not `quoted` post but something else
const QUOTED_POST_RE = /^Post by @\w+$/;

export function isLens(name?: string) {
    if (!name) return false;
    name = name.toLowerCase();
    return name.endsWith('.lens') || name === 'lensprotocol' || name === '@lensprotocol';
}

export function isLensCollect(name: string) {
    return NORMAL_COLLECT_RE.test(name) || ADMIN_COLLECT_RE.test(name);
}

export function isLensComment(name: string) {
    return NORMAL_COMMENT_RE.test(name) || ADMIN_COMMENT_RE.test(name) || QUOTED_COMMENT_RE.test(name);
}

export function isLensFollower(name: string) {
    // vitalik.lens-Follower, lensprotocol-Follower V2
    return (
        name.includes('.lens-Follower') || name.includes('lensprotocol-Follower') || name.endsWith("'s follower NFT")
    );
}

export function isLensPost(name: string) {
    return (
        NORMAL_POST_RE.test(name) || ADMIN_POST_RE.test(name) || GENESIS_POST_RE.test(name) || QUOTED_POST_RE.test(name)
    );
}
