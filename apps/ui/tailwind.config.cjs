/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./src/app/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            // Same keys/values as apps/web/tailwind.config.cjs, limited to the tokens
            // actually standardized across the product (see the GH issue for usage evidence).
            colors: {
                main: 'rgb(var(--color-main) / <alpha-value>)',
                second: 'var(--color-second)',
                secondary: 'var(--color-secondary)',
                third: 'var(--color-third)',
                fourMain: 'var(--color-main4)',
                thirdMain: 'var(--color-main3)',
                lightMain: 'var(--color-light-main)',
                primaryBottom: 'rgb(var(--color-bottom) / <alpha-value>)',
                bg: 'var(--color-bg)',
                lightBg: 'var(--color-light-bg)',
                input: 'var(--color-input)',
                darkBottom: 'var(--color-dark-bottom)',
                lightBottom: 'var(--m-light-bottom)',
                line: 'var(--color-line)',
                secondaryLine: 'var(--color-line2)',
                highlight: 'rgb(var(--color-highlight) / <alpha-value>)',
                lightHighlight: 'rgb(var(--color-light-highlight) / <alpha-value>)',
                fireflyBrand: 'var(--color-firefly-brand)',
                link: 'rgb(var(--color-link) / <alpha-value>)',
                danger: 'rgb(var(--color-danger) / <alpha-value>)',
                commonDanger: 'var(--m-common-danger)',
                warn: 'rgb(var(--color-warn) / <alpha-value>)',
                commonWarn: 'rgb(var(--m-common-warn) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                secondarySuccess: 'rgb(var(--color-secondary-success) / <alpha-value>)',
                fail: 'rgb(var(--color-fail) / <alpha-value>)',
                lensPrimary: 'rgb(var(--color-lens-primary) / <alpha-value>)',
                farcasterPrimary: 'rgb(var(--color-farcaster-primary) / <alpha-value>)',
                twitterPrimary: 'rgb(var(--color-twitter-primary) / <alpha-value>)',
                bskyPrimary: 'rgb(var(--color-bsky-primary) / <alpha-value>)',
                twitterVerified: '#8299ab',
                bgModal: 'var(--color-bg-modal)',
            },
            fontFamily: {
                inter: ['var(--font-inter)'],
            },
            fontSize: {
                medium: '0.9375rem',
            },
        },
    },
    plugins: [],
};
