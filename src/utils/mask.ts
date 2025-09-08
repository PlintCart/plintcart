export const maskEmail = (email: string) => email.replace(/(.).+(@.+)/, '$1***$2');
export const maskPhone = (phone: string) => phone.replace(/.(?=....)/g, '*');
