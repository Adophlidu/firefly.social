import { Trans } from '@lingui/react/macro';

import { SettingsSection } from '@/legacy/[locale]/(settings)/components/Section.js';
import { MutedContents } from '@/legacy/[locale]/(settings)/settings/privacy-and-security/pages/MutedContents.js';
import { PasswordSettings } from '@/legacy/[locale]/(settings)/settings/privacy-and-security/pages/PasswordSettings.js';

export default function PrivacyAndSecurityPage() {
    return (
        <SettingsSection title={<Trans>Privacy and security</Trans>}>
            <div className="relative w-full space-y-6">
                <PasswordSettings />

                <MutedContents />
            </div>
        </SettingsSection>
    );
}
