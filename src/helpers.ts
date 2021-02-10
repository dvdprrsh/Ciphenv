import crypto from "crypto";

export const DECRYPTED_REGEX = /^(?<isDecrypted>DEC:)?(?<value>.+)/i;
export const ENCRYPTED_REGEX = /^(?<isEncrypted>ENC:)?(?<value>.+)/i;

export const algorithm = "aes-256-gcm";
export const ivLength = 16;
export const saltLength = 16;
export const tagLength = 16;
export const iterations = 100000;
export const keyLen = 32;
export const digest = "sha256";
export const saltSlice = {
  start: 0,
  end: saltLength,
};
export const ivSlice = {
  start: saltSlice.end,
  end: saltSlice.end + ivLength,
};
export const tagSlice = {
  start: ivSlice.end,
  end: ivSlice.end + tagLength,
};
export const encryptedValueSlice = {
  start: tagSlice.end,
  end: undefined,
};

export const getIV = (): Buffer => crypto.randomBytes(ivLength);
export const getSalt = (): Buffer => crypto.randomBytes(saltLength);
export const getKey = (secret: crypto.BinaryLike, salt: crypto.BinaryLike): Buffer => crypto.pbkdf2Sync(secret, salt, iterations, keyLen, digest);
export const getCipher = (cipherKey: crypto.CipherKey, iv: crypto.BinaryLike | null): crypto.CipherGCM => crypto.createCipheriv(algorithm, cipherKey, iv);
export const getDecipher = (decipherKey: crypto.CipherKey, iv: crypto.BinaryLike | null): crypto.DecipherGCM => crypto.createDecipheriv(algorithm, decipherKey, iv);
