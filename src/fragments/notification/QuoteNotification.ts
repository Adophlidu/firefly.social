import { graphql } from '@lens-protocol/client';

export const QuoteNotificationFragment = graphql(`
    fragment QuoteNotification on QuoteNotification {
        __typename
        id
        quote {
            ...Post
        }
    }
`);
