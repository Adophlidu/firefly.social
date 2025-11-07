class AtUri {
    constructor(
        public did: string,
        public host: string,
        public cid: string,
    ) {}

    [Symbol.toStringTag]() {
        return this.toUri();
    }

    toId() {
        return `${this.did}_${this.cid}`;
    }

    toUri() {
        return `at://did:plc:${this.did}/${this.host}/${this.cid}`;
    }
}

export class PostAtUri extends AtUri {
    constructor(did: string, cid: string) {
        super(did, 'app.bsky.feed.post', cid);
    }

    static from(uri: string) {
        const fragments = uri.split(':').at(-1)?.split('/');
        if (!fragments) throw new Error(`Invalid post at uri = ${uri}`);
        const [did, _, cid] = fragments;
        return new PostAtUri(did, cid);
    }

    static fromId(postId: string) {
        const [did, cid] = postId.split('_');
        return new PostAtUri(did, cid);
    }
}

export class ChannelAtUri extends AtUri {
    constructor(did: string, cid: string) {
        super(did, 'app.bsky.feed.generator', cid);
    }

    static from(uri: string) {
        const fragments = uri.split(':').at(-1)?.split('/');
        if (!fragments) throw new Error(`Invalid channel at uri = ${uri}`);
        const [did, _, cid] = fragments;
        return new ChannelAtUri(did, cid);
    }

    static fromId(channelId: string) {
        const [did, cid] = channelId.split('_');
        return new ChannelAtUri(did, cid);
    }
}
