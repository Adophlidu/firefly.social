import { SIGNUP_AUDIO_ID } from '@/constants/index.js';

export function playSignupAudio() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (!audio) {
        console.warn('Signup audio element not found');
        return;
    }
    audio.loop = true;
    audio.muted = false; // Ensure audio is not muted
    audio.currentTime = 0; // Reset to the beginning
    audio.volume = 0.5; // Set volume to a reasonable level
    audio.play().catch((error) => {
        console.error('Failed to play signup audio:', error);
    });
}

export function stopSignupAudio() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // Reset to the beginning
    } else {
        console.warn('Signup audio element not found');
    }
}

export function toggleSignupAudio() {
    const audio = document.getElementById(SIGNUP_AUDIO_ID) as HTMLAudioElement | null;
    if (!audio) {
        console.warn('Signup audio element not found');
        return;
    }
    if (audio.paused) {
        playSignupAudio();
    } else {
        stopSignupAudio();
    }
}
