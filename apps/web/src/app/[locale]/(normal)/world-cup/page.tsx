import { WorldCupModal } from '@/components/WorldCup/WorldCupModal.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/world-cup');
}

export default function WorldCupPage() {
    return <WorldCupModal />;
}
