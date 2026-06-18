/* cspell:disable */

export const createPostFragments = `
    mutation CreatePost($request: CreatePostRequest!) {
        post(request: $request) {
            ... on PostResponse {
                ...PostResponse
            }
            ... on SponsoredTransactionRequest {
                ...SponsoredTransactionRequest
            }
            ... on SelfFundedTransactionRequest {
                ...SelfFundedTransactionRequest
            }
            ... on PostOperationValidationFailed {
                ...PostOperationValidationFailed
            }
            ... on TransactionWillFail {
                ...TransactionWillFail
            }
        }
    }

    fragment PostResponse on PostResponse {
        __typename
        hash
    }

    fragment SponsoredTransactionRequest on SponsoredTransactionRequest {
        __typename
        reason
        sponsoredReason
        raw {
            ...Eip712TransactionRequest
        }
    }

    fragment Eip712TransactionRequest on Eip712TransactionRequest {
        __typename
        type
        to
        from
        nonce
        gasLimit
        maxFeePerGas
        maxPriorityFeePerGas
        data
        value
        chainId
        customData {
            __typename
            gasPerPubdata
            factoryDeps
            customSignature
            paymasterParams {
                __typename
                paymaster
                paymasterInput
            }
        }
    }

    fragment SelfFundedTransactionRequest on SelfFundedTransactionRequest {
        __typename
        reason
        selfFundedReason
        raw {
            ...Eip1559TransactionRequest
        }
    }

    fragment Eip1559TransactionRequest on Eip1559TransactionRequest {
        __typename
        type
        from
        to
        nonce
        gasLimit
        maxPriorityFeePerGas
        maxFeePerGas
        data
        value
        chainId
    }

    fragment PostOperationValidationFailed on PostOperationValidationFailed {
        __typename
        unsatisfiedRules {
            ...PostUnsatisfiedRules
        }
        reason
    }

    fragment PostUnsatisfiedRules on PostUnsatisfiedRules {
        __typename
        required {
            ...PostUnsatisfiedRule
        }
        anyOf {
            ...PostUnsatisfiedRule
        }
    }

    fragment PostUnsatisfiedRule on PostUnsatisfiedRule {
        __typename
        rule
        reason
        message
        config {
            ...AnyKeyValue
        }
    }

    fragment AnyKeyValue on AnyKeyValue {
        ... on IntKeyValue {
            ...IntKeyValue
        }
        ... on IntNullableKeyValue {
            ...IntNullableKeyValue
        }
        ... on AddressKeyValue {
            ...AddressKeyValue
        }
        ... on StringKeyValue {
            ...StringKeyValue
        }
        ... on BooleanKeyValue {
            ...BooleanKeyValue
        }
        ... on RawKeyValue {
            ...RawKeyValue
        }
        ... on BigDecimalKeyValue {
            ...BigDecimalKeyValue
        }
        ... on DictionaryKeyValue {
            ...DictionaryKeyValue
        }
        ... on ArrayKeyValue {
            ...ArrayKeyValue
        }
    }

    fragment IntKeyValue on IntKeyValue {
        __typename
        key
        int
    }

    fragment IntNullableKeyValue on IntNullableKeyValue {
        __typename
        key
        optionalInt
    }

    fragment AddressKeyValue on AddressKeyValue {
        __typename
        key
        address
    }

    fragment StringKeyValue on StringKeyValue {
        __typename
        key
        string
    }

    fragment BooleanKeyValue on BooleanKeyValue {
        __typename
        key
        boolean
    }

    fragment RawKeyValue on RawKeyValue {
        __typename
        key
        data
    }

    fragment BigDecimalKeyValue on BigDecimalKeyValue {
        __typename
        key
        bigDecimal
    }

    fragment DictionaryKeyValue on DictionaryKeyValue {
        __typename
        key
        dictionary {
            ...PrimitiveData
        }
    }

    fragment PrimitiveData on PrimitiveData {
        ... on IntKeyValue {
            ...IntKeyValue
        }
        ... on IntNullableKeyValue {
            ...IntNullableKeyValue
        }
        ... on AddressKeyValue {
            ...AddressKeyValue
        }
        ... on StringKeyValue {
            ...StringKeyValue
        }
        ... on BooleanKeyValue {
            ...BooleanKeyValue
        }
        ... on RawKeyValue {
            ...RawKeyValue
        }
        ... on BigDecimalKeyValue {
            ...BigDecimalKeyValue
        }
    }

    fragment ArrayKeyValue on ArrayKeyValue {
        __typename
        key
        array {
            ...ArrayData
        }
    }

    fragment ArrayData on ArrayData {
        ... on IntKeyValue {
            ...IntKeyValue
        }
        ... on IntNullableKeyValue {
            ...IntNullableKeyValue
        }
        ... on AddressKeyValue {
            ...AddressKeyValue
        }
        ... on StringKeyValue {
            ...StringKeyValue
        }
        ... on BooleanKeyValue {
            ...BooleanKeyValue
        }
        ... on RawKeyValue {
            ...RawKeyValue
        }
        ... on BigDecimalKeyValue {
            ...BigDecimalKeyValue
        }
        ... on DictionaryKeyValue {
            ...DictionaryKeyValue
        }
    }

    fragment TransactionWillFail on TransactionWillFail {
        __typename
        reason
    }
`;
