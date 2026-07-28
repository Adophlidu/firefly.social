import { notFound } from '@dimensiondev/ssr';

import { DirectMessages } from '@/components/DirectMessages/DirectMessages.js';
import { FEATURE_FLAGS } from '@/constants/featureFlags.js';

export function loader(): void {
    if (!FEATURE_FLAGS.messages) notFound();
}

export default function Page() {
    return <DirectMessages />;
}
