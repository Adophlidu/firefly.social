import { Suspense } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { Signup } from '@/legacy/[locale]/(whiteboard)/signup/pages/Signup.js';

export function head() {
    return fromNextMetadata(createSiteMetadata('/signup'));
}

export default function SignupPage() {
    return (
        <Suspense>
            <Signup />
        </Suspense>
    );
}
