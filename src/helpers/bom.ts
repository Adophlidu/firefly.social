export const bom = {
    get window() {
        return typeof self === 'undefined' ? null : self;
    },

    get document() {
        return typeof document === 'undefined' ? null : document;
    },

    get location() {
        return typeof location === 'undefined' ? null : location;
    },

    get navigator() {
        return typeof navigator === 'undefined' ? null : navigator;
    },

    get localStorage() {
        return typeof localStorage === 'undefined' ? null : localStorage;
    },
};
