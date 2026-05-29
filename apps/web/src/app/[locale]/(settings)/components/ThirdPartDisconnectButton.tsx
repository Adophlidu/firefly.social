import DisconnectIcon from '@dimensiondev/assets/disconnect.svg';
import { useAsyncFn } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { openAndWaitForCloseDisconnectFireflyAccountModal } from '@/helpers/openDisconnectFireflyAccountModal.js';
import type { Account } from '@/providers/types/Account.js';

interface Props {
    account: Account;
    onSucceed?: () => void;
}

export function ThirdPartDisconnectButton({ account, onSucceed }: Props) {
    const [{ loading }, handleDisconnect] = useAsyncFn(async () => {
        await openAndWaitForCloseDisconnectFireflyAccountModal({
            account,
        });
        onSucceed?.();
    }, [account, onSucceed]);

    if (loading) {
        return <LoadingIcon className="text-lightMain" />;
    }

    return (
        <ClickableButton className="text-lightMain" disabled={loading} onClick={handleDisconnect}>
            <DisconnectIcon width={24} height={24} />
        </ClickableButton>
    );
}
