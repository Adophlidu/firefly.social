import webCrypto from 'crypto';

export function encryptMetricsData(text: string, key: string, iv: string) {
    const cipher = webCrypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}
