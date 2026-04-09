import { MysteryBoxModal } from '@/components/MysteryBox/MysteryBoxModal.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/mystery-box', {
        openGraph: { images: ['/image/mystery-box.png'] },
        twitter: { images: ['/image/mystery-box.png'] },
    });
}

export default function MysteryBoxPage() {
    return <MysteryBoxModal />;
}
