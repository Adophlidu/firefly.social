import { WorldCupModal } from '@/components/WorldCup/WorldCupModal.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    return createSiteMetadata('/world-cup');
}

export default function WorldCupPage() {
    return <WorldCupModal />;
}
