import { RouterProvider } from '@tanstack/react-router';
import { useCallback } from 'react';

import { router } from '@/components/Tips/TipsModalRouter.js';
import { TipsModalRef } from '@/modals/TipsModal/index.js';

export function TipsModalContent() {
    const onClose = useCallback(() => {
        TipsModalRef.close({});
    }, []);

    return <RouterProvider router={router} context={{ onClose }} />;
}
