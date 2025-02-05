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

export function encodeBskyChannelId(uri: string) {
    const result = uri.split(':').at(-1)?.split('/');
    if (!result) return '';
    const [id, _, handle] = result;

    return [handle, id].join('_');
}

export function decodeBskyChannelId(channelId: string) {
    const [handle, id] = channelId.split('_');
    return {
        handle,
        id,
    };
}

export function resolveBskyChannelAtUri(channelId: string) {
    const { handle, id } = decodeBskyChannelId(channelId);
    const host = 'app.bsky.feed.generator';

    return `at://did:plc:${id}/${host}/${handle}`;
}
