import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { WorldCupModal } from '@/components/WorldCup/WorldCupModal.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    return fromNextMetadata(createSiteMetadata('/world-cup'));
}

export default function WorldCupPage() {
    return <WorldCupModal />;
}
