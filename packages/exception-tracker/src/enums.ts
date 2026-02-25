export enum ExceptionId {
    // Custom error
    CUSTOM_ERROR = 'custom_error',

    // Client-side
    UI_CRASH = 'ui_crash',
    SNACKBAR_ERROR = 'snackbar_error',
    RUNTIME_ERROR = 'runtime_error',
    UNHANDLED_REJECTION = 'unhandled_rejection',
    REACT_QUERY_ERROR = 'react_query_error',
    RESOURCE_LOAD_ERROR = 'resource_load_error',
    NETWORK_ERROR = 'network_error',
    CHUNK_LOAD_ERROR = 'chunk_load_error',

    // Server-side
    API_ROUTE_ERROR = 'api_route_error',
}
