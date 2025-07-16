let finishFontLoading: () => void;
const fontLoading = new Promise<void>((resolve) => {
    finishFontLoading = resolve;
});

let finishSignupLoading: () => void;
const signupCheckLoading = new Promise<void>((resolve) => {
    finishSignupLoading = resolve;
});

Promise.all([fontLoading, signupCheckLoading]).then(() => {
    const globalLoading = document.getElementById('global-loading');
    if (globalLoading) {
        globalLoading.style.display = 'none';
    }
});

export function finishLoadFont() {
    finishFontLoading?.();
}

export function finishSignupCheck() {
    finishSignupLoading?.();
}
