'use client';

import { Trans } from '@lingui/react/macro';

import { Link } from '@/components/Activity/Link.js';
import { FIREFLY_TELEGRAM_URL } from '@/constants/index.js';

export function ActivityContactUs() {
    return (
        <p className="w-full text-center text-[10px]">
            <Trans>
                For any inquiries, please{' '}
                <Link href={FIREFLY_TELEGRAM_URL} target="_blank" className="inline text-highlight">
                    contact us
                </Link>
                . All rights reserved by Firefly.
            </Trans>
        </p>
    );
}
