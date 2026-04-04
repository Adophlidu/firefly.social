import DarkLogo from '@dimensiondev/assets/logo.dark.svg';
import LightLogo from '@dimensiondev/assets/logo.light.svg';
import MiniLogo from '@dimensiondev/assets/miniLogo.svg';
import { memo } from 'react';

export const SideBarLogo = memo(function SideBarLogo() {
    return (
        <>
            <LightLogo width={169} height={80} className="sidebar-light-logo max-md:hidden" />
            <DarkLogo width={169} height={80} className="sidebar-dark-logo max-md:hidden" />
            <MiniLogo className="ml-5 md:hidden" width={33} height={43} />
        </>
    );
});
