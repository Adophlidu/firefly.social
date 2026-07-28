export const MaskDelegateCookieName = 'X-REQUEST_TOKEN-MASK-DELEGATE';
export const DeleteCookieScript = `document.cookie='X-REQUEST_TOKEN-MASK-DELEGATE=0; path=/api/auth/callback/twitter; expires='+new Date(0).toUTCString()`;
