import { SITE_NAME } from '@dimensiondev/constants/static';
import { Link } from '@dimensiondev/ssr';

/**
 * Placeholder for the home feed. The Next page at src/app/[locale]/(normal)/page.tsx
 * is a client-side, login-dependent redirect into the discover/following feeds,
 * which are far too heavy for the first migration slice. This page exists so the
 * skeleton serves a 200 at `/<locale>`; it will be replaced when the feed pages
 * are migrated.
 */
export function head() {
    return {
        title: SITE_NAME,
    };
}

export default function HomePage() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-16">
            <h1 className="text-2xl font-bold">{SITE_NAME}</h1>
            <p>
                This is the @dimensiondev/ssr migration skeleton. Migrated slice:{' '}
                <Link className="text-main underline" href="/en/article/1">
                    /en/article/[id]
                </Link>
                .
            </p>
        </main>
    );
}
