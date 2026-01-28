export const generateLogin = (name) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '');
    return `${sanitizedName}${randomNum}`;
};

export const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};
