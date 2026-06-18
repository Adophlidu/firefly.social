export const LENS_ACCOUNT_FRAGMENTS = `
    fragment AnyKeyValue on AnyKeyValue {
        ... on AddressKeyValue {
            key
            address
            __typename
        }
        ... on BigDecimalKeyValue {
            key
            bigDecimal
            __typename
        }
        ... on StringKeyValue {
            key
            string
            __typename
        }
        __typename
    }

    fragment Account on Account {
        owner
        address
        rules {
            anyOf {
                ...AccountFollowRule
                __typename
            }
            required {
                ...AccountFollowRule
                __typename
            }
            __typename
        }
        operations {
            ...LoggedInAccountOperations
            __typename
        }
        metadata {
            ...AccountMetadata
            __typename
        }
        username(request: {autoResolve: true}) {
            ...Username
            __typename
        }
        heyEns: username(
            request: {namespace: "0x6821262A0E15Ed3b4bFD54c1B4fe558C093A103B"}
        ) {
            ...Username
            __typename
        }
        ...Permissions
        __typename
    }

    fragment AccountFollowRule on AccountFollowRule {
        id
        type
        config {
            ...AnyKeyValue
            __typename
        }
        __typename
    }

    fragment AccountMetadata on AccountMetadata {
        id
        name
        bio
        picture
        coverPicture
        attributes {
            ...MetadataAttribute
            __typename
        }
        __typename
    }

    fragment LoggedInAccountOperations on LoggedInAccountOperations {
        id
        isFollowedByMe
        isFollowingMe
        isMutedByMe
        isBlockedByMe
        hasBlockedMe
        __typename
    }

    fragment Permissions on Account {
        hasSubscribed: isMemberOf(
            request: {group: "0x4BE5b4519814A57E6f9AaFC6afBB37eAEeE35aA3"}
        )
        isStaff: isMemberOf(
            request: {group: "0xA7f2835e54998c6d7d4A0126eC0ebE91b5E43c69"}
        )
        isBeta: isMemberOf(
            request: {group: "0x287b09fAa3AfC548F1b28DEa36C30c1edc574C06"}
        )
        preferNameInFeed: isMemberOf(
            request: {group: "0xA942e6BE7A6EA8822316284619B94e7838fA69ac"}
        )
        __typename
    }

    fragment Username on Username {
        namespace
        localName
        linkedTo
        value
        ownedBy
        __typename
    }

    fragment MetadataAttribute on MetadataAttribute {
        type
        key
        value
        __typename
    }
`;
