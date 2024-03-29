import crypto from "crypto";
import { CommandModule } from "yargs";
import { Arguments } from "./types";

export const DECRYPTED_REGEX = /^((?<isDecrypted>DEC):|(?<isDecryptedFile>DEC_FILE_PATH):)?(?<value>.+)/i;
export const ENCRYPTED_REGEX = /^(?<isEncrypted>ENC:)?(?<value>.+)/i;
export const ENCRYPTED_FILE_REGEX = /^(?<path>.+)_PATH_END_(?<value>.+)/is;

export class CiphenvError extends Error {
  public key?: string;
  constructor({ error, key }: { error: unknown; key?: string }) {
    super();
    this.key = key;
    if (!(error instanceof Error)) {
      this.message = String(error);
      return this;
    }
    this.name = error.name;
    this.message = error.message;
    this.stack = error.stack;
    return this;
  }
}

export function createCiphenvError(options: { error: unknown; key?: string }): CiphenvError {
  return new CiphenvError(options);
}

export function getBuilder(type: "encryption" | "decryption"): CommandModule<Arguments, Arguments>["builder"] {
  const isEncryption = type === "encryption";
  return {
    replace: {
      alias: "R",
      boolean: true,
      describe: "Replace the specified .env file with the new contents",
      default: false,
    },
    secret: {
      alias: "S",
      nargs: 1,
      demandOption: isEncryption
        ? "A custom secret is required"
        : "The secret used for encryption is required for decryption",
      describe: `Secret to use for ${type}`,
    },
    file: {
      alias: "F",
      describe: "Path to .env*",
      default: false,
      coerce(arg: string | boolean): string | false {
        if (typeof arg === "string") {
          return arg;
        }
        return arg && ".env";
      },
    },
    value: {
      alias: "V",
      nargs: 1,
      describe: `Value to be ${isEncryption ? "encrypted" : "decrypted"}`,
      string: true,
      demandOption: false,
    },
  };
}

export const algorithm: crypto.CipherGCMTypes = "aes-256-gcm";
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

export function getIV(): Buffer {
  return crypto.randomBytes(ivLength);
}
export function getSalt(): Buffer {
  return crypto.randomBytes(saltLength);
}
export function getKey(secret: crypto.BinaryLike, salt: crypto.BinaryLike): Buffer {
  return crypto.pbkdf2Sync(secret, salt, iterations, keyLen, digest);
}
export function getCipher(cipherKey: crypto.CipherKey, iv: crypto.BinaryLike): crypto.CipherGCM {
  return crypto.createCipheriv(algorithm, cipherKey, iv);
}
export function getDecipher(decipherKey: crypto.CipherKey, iv: crypto.BinaryLike): crypto.DecipherGCM {
  return crypto.createDecipheriv(algorithm, decipherKey, iv);
}
