import { DirectMessages } from '@/components/DirectMessages/DirectMessages.js';
import { FEATURE_FLAGS } from '@/constants/featureFlags.js';
import { notFound } from '@/esm/navigation/server.js';

export default function Page() {
    if (!FEATURE_FLAGS.messages) notFound();

    return <DirectMessages />;
}
