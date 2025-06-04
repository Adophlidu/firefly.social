import { type Hex, hexToBytes } from 'viem';

const APP_LOGIN_ENCRYPT_IV = '0x4f05c37c16c801c2516b0338a8fd0cf9';

export async function decryptAppScanLoginEncryptedData(data: string, otp: string): Promise<string> {
    const iv = hexToBytes(APP_LOGIN_ENCRYPT_IV);
    const encryptedData = hexToBytes((data.startsWith('0x') ? data : `0x${data}`) as Hex);

    // Derive AES key using SHA-256 hash of OTP
    const otpBytes = new TextEncoder().encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', otpBytes);
    const aesKey = await crypto.subtle.importKey('raw', hashBuffer, { name: 'AES-CBC' }, false, ['decrypt']);

    // Decrypt using AES-CBC
    const decryptedBuffer = await crypto.subtle.decrypt(
        {
            name: 'AES-CBC',
            iv,
        },
        aesKey,
        encryptedData,
    );

    return new TextDecoder().decode(decryptedBuffer);
}
