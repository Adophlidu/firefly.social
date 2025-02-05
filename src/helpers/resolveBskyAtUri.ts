export function encodeBskyPostId(handle: string, uri: string) {
    return [handle, uri.split('/').at(-1)].join('-');
}

export function decodeBskyPostId(postId: string) {
    const [handle, cid] = postId.split('-');
    return {
        handle,
        cid,
    };
}

export function formatAtUri(did: string, cid: string, host = 'app.bsky.feed.post') {
    return `at://${did}/${host}/${cid}`;
}

export function resolveBskyAtUri(postId: string) {
    const { handle, cid } = decodeBskyPostId(postId);
    return formatAtUri(handle, cid);
}
