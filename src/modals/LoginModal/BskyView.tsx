import { LoginBsky } from "@/components/Login/LoginBsky.jsx";
import { Trans } from "@lingui/react/macro";


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
