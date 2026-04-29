export function desensitizeEmail(email: string) {
    if (!email?.includes('@')) return email;

    const [name, domain] = email.split('@');

    let maskedName = '';
    if (name.length === 1) {
        maskedName = name + '***';
    } else if (name.length <= 3) {
        maskedName = name.charAt(0) + '***';
    } else {
        maskedName = name.substring(0, 2) + '***' + name.substring(name.length - 1);
    }

    return `${maskedName}@${domain}`;
}
