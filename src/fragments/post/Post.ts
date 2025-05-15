import { graphql } from '@lens-protocol/client';

export const PostFragment = graphql(`
    fragment Post on Post {
        ...ReferencedPost
        root {
            ...ReferencedPost
        }
        commentOn {
            ...ReferencedPost
        }
        quoteOf {
            ...ReferencedPost
        }
        app {
            ...App
        }
    }
`);
