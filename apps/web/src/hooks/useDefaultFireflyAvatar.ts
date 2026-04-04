import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

export function useDefaultFireflyAvatar() {
    const isDarkMode = useIsDarkMode();

    return isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
}
