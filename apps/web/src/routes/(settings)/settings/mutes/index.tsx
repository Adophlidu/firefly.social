
import { useEffect } from 'react';

import { useRouter } from '@/esm/navigation.js';

export default function Page() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/settings/privacy-and-security');
    }, [router]);
    return null;
}
