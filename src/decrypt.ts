import Case from "case";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { CommandModule } from "yargs";
import { encryptedValueSlice, ENCRYPTED_REGEX, getDecipher, getKey, ivSlice, saltSlice, tagSlice } from "./helpers";
import Logger from "./logger";
import { Arguments } from "./types";

export function getDecryptedValue(secret: string, value: string, key?: string): string {
  try {
    const buffer = Buffer.from(value, "base64");
    const salt = buffer.slice(saltSlice.start, saltSlice.end);
    const iv = buffer.slice(ivSlice.start, ivSlice.end);
    const tag = buffer.slice(tagSlice.start, tagSlice.end);
    const encryptedValue = buffer.slice(encryptedValueSlice.start);
    const decipherKey = getKey(secret, salt);
    const decipher = getDecipher(decipherKey, iv);
    decipher.setAuthTag(tag);
    return [decipher.update(encryptedValue), decipher.final("utf8")].join("");
  } catch (error) {
    Logger.error("Error during decryption!", ...(!key ? [] : ["Error key:", key]));
    Logger.info("Did you use the correct secret to encrypt/decrypt the value?");
    throw error;
  }
}

export function getDecryptedValues(secret: string, env: { [key: string]: any }): { [key: string]: any } {
  return Object.entries(env).reduce((prev, [key, value]) => {
    const defaultReturn = { ...prev, [key]: value };
    if (typeof value !== "string") {
      return defaultReturn;
    }
    const regexResult = ENCRYPTED_REGEX.exec(value);
    if (!regexResult?.groups?.isEncrypted) {
      return defaultReturn;
    }
    return { ...prev, [key]: getDecryptedValue(secret, regexResult.groups.value, key) };
  }, {});
}

function decryptFile(secret: string, file: string | true, replace: boolean) {
  const envPath = path.join(cwd(), typeof file === "boolean" ? ".env" : file);
  const env = dotenv.config({ path: envPath });
  if (env.error) {
    throw env.error;
  }
  if (!env.parsed) {
    throw new Error(`.env file not found at ${envPath}`);
  }

  const encEnvString = Object.entries(env.parsed).reduce(function (prev, [key, value]) {
    const constantCasedKey = Case.constant(key);
    const regexResult = ENCRYPTED_REGEX.exec(value);
    if (typeof value !== "string" || !regexResult?.groups?.isEncrypted) {
      return `${prev}${constantCasedKey}=${typeof value === "string" ? `"${value}"` : value}\n`;
    }
    return `${prev}${constantCasedKey}="DEC:${getDecryptedValue(secret, regexResult.groups.value, key)}"\n`;
  }, "");

  let filePath = path.join(path.dirname(envPath), `${path.basename(envPath).replace(".enc", "")}.dec`);
  if (replace) {
    filePath = envPath;
  }
  fs.writeFileSync(filePath, encEnvString);
  Logger.info(`.env file decrypted and saved to ${filePath}`);
}

function decryptValue(secret: string, value: string) {
  const decrypted = getDecryptedValue(secret, value);
  Logger.success("Decrypted value:", decrypted);
}

function decrypt(args: Arguments): void {
  if (args.file) {
    decryptFile(args.secret, args.file, args.replace);
  }
  if (args.value) {
    decryptValue(args.secret, args.value);
  }
  Logger.success("✅ Ciphenv Completed Decryption");
}

const command: CommandModule<Arguments, Arguments> = {
  command: "decrypt",
  describe: "Decrypt specified .env* file",
  builder: {
    replace: {
      alias: "R",
      boolean: true,
      describe: "Replace the specified .env file with the new contents",
      default: false,
    },
    secret: {
      alias: "S",
      nargs: 1,
      demandOption: "The secret used for encryption is required for decryption",
      describe: "Secret to use for decryption",
    },
    file: {
      alias: "F",
      describe: "Path to .env*",
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
      describe: "Value to be decrypted",
      demandOption: false,
    },
  },
  handler: decrypt,
};

export default command;
