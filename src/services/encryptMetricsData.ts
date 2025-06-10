import webCrypto from 'crypto';

export function encryptMetricsData(text: string, key: string, iv: string) {
    const cipher = webCrypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

export function decryptMetricsData(text: string, key: string, iv: string) {
    const decipher = webCrypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(text, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}
