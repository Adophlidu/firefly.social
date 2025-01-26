import { Trans } from '@lingui/react/macro';

import { LoginBsky } from '@/components/Login/LoginBsky.js';

export const BskyViewBeforeLoad = () => {
    return {
        title: <Title />,
    };
};

function Title() {
    return <Trans>Sign in</Trans>;
}

export function BskyView() {
    return <LoginBsky />;
}
