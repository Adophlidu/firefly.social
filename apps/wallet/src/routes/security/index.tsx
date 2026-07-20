import { Trans } from '@lingui/react/macro';

import { NavigationBar } from '@/components/NavigationBar.js';
import { SecuritySettings } from '@/components/Security/index.js';

export default SecuritySettingsPage;
function SecuritySettingsPage() {
    return (
        <div className="flex size-full min-h-0 flex-1 flex-col">
            <NavigationBar className="w-full shrink-0">
                <Trans>Security & Privacy</Trans>
            </NavigationBar>
            <div className="min-h-0 w-full flex-1 p-4">
                <SecuritySettings />
            </div>
        </div>
    );
}
