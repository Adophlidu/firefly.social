import { graphql } from '@lens-protocol/client';

export const ReferencedPostFragment = graphql(`
    fragment ReferencedPost on Post {
        __typename
        id
        slug
        isEdited
        contentUri
        isDeleted
        feed {
            ...PostFeedInfo
        }
        author {
            ...Account
        }
        metadata {
            ...PostMetadata
        }
        stats {
            ...PostStats
        }
        operations {
            ...LoggedInPostOperations
        }
        actions {
            ...PostAction
        }
        mentions {
            ...PostMention
        }
        timestamp
    }
`);
