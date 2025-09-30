import { graphql } from '@lens-protocol/client';

export const CommentNotificationFragment = graphql(`
    fragment CommentNotification on CommentNotification {
        __typename
        id
        comment {
            ...Post
        }
    }
`);
