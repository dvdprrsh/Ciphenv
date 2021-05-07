import { constantCase } from "constant-case";
import { parse } from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { CommandModule } from "yargs";
import {
  encryptedValueSlice,
  ENCRYPTED_FILE_REGEX,
  ENCRYPTED_REGEX,
  getBuilder,
  getDecipher,
  getKey,
  ivSlice,
  saltSlice,
  tagSlice,
} from "./helpers";
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

    let decrypted = getDecryptedValue(secret, regexResult.groups.value, key);

    const encFileRes = decrypted.match(ENCRYPTED_FILE_REGEX);
    if (encFileRes?.groups?.path) {
      decrypted = encFileRes.groups.value;
    }

    return { ...prev, [key]: decrypted };
  }, {});
}

function decryptFile(secret: string, file: string | true, replace: boolean) {
  const envPath = path.join(cwd(), typeof file === "boolean" ? ".env" : file);
  if (!fs.existsSync(envPath)) throw new Error(`${envPath} not found`);

  const env = parse(fs.readFileSync(envPath));

  const encEnvString = Object.entries(env).reduce(function (prev, [key, value]) {
    const constantCasedKey = constantCase(key);
    const regexResult = ENCRYPTED_REGEX.exec(value);

    if (typeof value !== "string" || !regexResult?.groups?.isEncrypted) {
      return `${prev}${constantCasedKey}=${typeof value === "string" ? `"${value}"` : value}\n`;
    }

    let decrypted = getDecryptedValue(secret, regexResult.groups.value, key);

    const encFileRes = decrypted.match(ENCRYPTED_FILE_REGEX);
    if (encFileRes?.groups?.path) {
      const encFile = encFileRes.groups;
      const decFilePath = path.join(path.dirname(envPath), encFile.path);

      if (!fs.existsSync(decFilePath)) {
        fs.mkdirSync(path.dirname(decFilePath), { recursive: true });
      }

      fs.writeFileSync(path.normalize(decFilePath), encFile.value);
      decrypted = `DEC_FILE_PATH:${encFile.path}`;
    } else {
      decrypted = `DEC:${decrypted}`;
    }

    return `${prev}${constantCasedKey}="${decrypted}"\n`;
  }, "");

  let filePath = envPath;
  if (!replace) {
    filePath = path.join(path.dirname(envPath), `${path.basename(envPath).replace(".enc", "")}.dec`);
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
    ...getBuilder("decryption"),
  },
  handler: decrypt,
};

export default command;
