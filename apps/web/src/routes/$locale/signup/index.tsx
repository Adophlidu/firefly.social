import { Suspense } from 'react';

import { Signup } from '@/app/[locale]/(whiteboard)/signup/pages/Signup.js';

export default function SignupPage() {
    return (
        <Suspense>
            <Signup />
        </Suspense>
    );
}
