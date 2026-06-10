/** Plain serializable SVGR options for webpack, turbopack, and Storybook. */
export const svgrOptions = {
    ref: true,
    svgoConfig: {
        // SVGO v4 preset-default no longer runs removeViewBox.
        plugins: ['preset-default', 'prefixIds'],
    },
};
