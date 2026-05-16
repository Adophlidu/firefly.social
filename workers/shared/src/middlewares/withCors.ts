import { cors } from 'hono/cors';

const defaultAllowedOriginRegexps = [
    /^localhost(:\d+)?$/,
    /^https?:\/\/web3\.bio$/,
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/firefly\.social$/,
    /^https?:\/\/[\w-]+\.firefly\.social$/,
    /^https?:\/\/[\w-]+-dimension-dev\.vercel\.app$/,
    /^chrome-extension:\/\/jkoeaghipilijlahjplgbfiocjhldnap$/, // cspell:disable-line
    /^https?:\/\/poc?ker-lab\.vercel\.app$/,
    /^https?:\/\/angleo\.poker$/,
];

export function withCors(allowedOriginRegexps = defaultAllowedOriginRegexps) {
    return cors({
        origin: (origin) => {
            if (!origin) return '';
            if (allowedOriginRegexps.some((re) => re.test(origin))) return origin;
            return '';
        },
        credentials: true,
    });
}
