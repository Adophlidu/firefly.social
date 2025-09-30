import { graphql } from '@lens-protocol/client';

import { LENS_PRO_GROUP_ID } from '@/constants/lens.js';

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
          hasSubscribed: isMemberOf(request: { group: "${LENS_PRO_GROUP_ID}" })
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
