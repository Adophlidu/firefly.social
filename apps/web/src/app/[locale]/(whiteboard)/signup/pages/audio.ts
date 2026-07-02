import { SIGNUP_AUDIO_ID } from '@dimensiondev/constants/static';

import { logger } from '@/libs/Logger.js';

let audioTimer: NodeJS.Timeout | null = null;
let lastVolume = 0.01;

function updateAudioVolume() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (!audio) return;

    const currentVolume = audio.volume;
    if (currentVolume >= 0.3) return;

    lastVolume = currentVolume + 0.01;
    audio.volume = currentVolume + 0.01;
    audioTimer = setTimeout(updateAudioVolume, 200);
}

export function preloadSignupAudio() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (!audio || audio.readyState > HTMLMediaElement.HAVE_NOTHING) return;
    audio.preload = 'auto';
    audio.load();
}

export function playSignupAudio() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (!audio) {
        logger.warn('Signup audio element not found');
        return;
    }
    audio.loop = true;
    audio.muted = false; // Ensure audio is not muted
    audio.currentTime = 0; // Reset to the beginning
    audio.volume = lastVolume; // Set volume to a reasonable level
    audio.play().catch((error) => {
        logger.error('Failed to play signup audio:', error);
    });
    updateAudioVolume();
}

function stopSignupAudio() {
    if (audioTimer) {
        clearTimeout(audioTimer);
        audioTimer = null;
    }
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // Reset to the beginning
    } else {
        logger.warn('Signup audio element not found');
    }
}

export function toggleSignupAudio() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (!audio) {
        logger.warn('Signup audio element not found');
        return;
    }
    if (audio.paused) {
        playSignupAudio();
    } else {
        stopSignupAudio();
    }
}
