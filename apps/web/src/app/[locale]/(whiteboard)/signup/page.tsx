import { Suspense } from 'react';

import { Signup } from '@/app/[locale]/(whiteboard)/signup/pages/Signup.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/signup');

// Server page with a page-level Suspense boundary: `useSearchParams` inside
// <Signup> bails out here instead of the empty layout-level boundary, so the
// route can still be rendered as static HTML once site-wide dynamic rendering
// is lifted.
export default function Page() {
    return (
        <Suspense>
            <Signup />
        </Suspense>
    );
}
