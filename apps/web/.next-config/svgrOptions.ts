/** Plain serializable SVGR options for webpack and turbopack. */
export const svgrOptions = {
    ref: true,
    svgoConfig: {
        // SVGO v4 preset-default no longer runs removeViewBox.
        plugins: ['preset-default', 'prefixIds'],
    },
};
