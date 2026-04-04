import { Trans } from '@lingui/react/macro';

import { LoginEmail } from '@/components/Login/LoginEmail.js';

export const EmailViewBeforeLoad = () => {
    return {
        title: <Title />,
    };
};

function Title() {
    return <Trans>Connect Email</Trans>;
}

export function EmailView() {
    return <LoginEmail />;
}
