import Case from "case";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { CommandModule } from "yargs";
import { encryptedValueSlice, ENCRYPTED_REGEX, getDecipher, getKey, ivSlice, saltSlice, tagSlice } from "./helpers";
import { Arguments } from "./types";

export const getDecryptedValue = (secret: string, value: string): string => {
  const buffer = Buffer.from(value, "base64");
  const salt = buffer.slice(saltSlice.start, saltSlice.end);
  const iv = buffer.slice(ivSlice.start, ivSlice.end);
  const tag = buffer.slice(tagSlice.start, tagSlice.end);
  const encryptedValue = buffer.slice(encryptedValueSlice.start);
  const decipherKey = getKey(secret, salt);
  const decipher = getDecipher(decipherKey, iv);
  decipher.setAuthTag(tag);
  return [decipher.update(encryptedValue), decipher.final("utf8")].join("");
};

export const getDecryptedValues = (secret: string, env: { [key: string]: any }): { [key: string]: any } =>
  Object.entries(env).reduce((prev, [key, value]) => {
    const defaultReturn = { ...prev, [key]: value };
    if (typeof value !== "string") {
      return defaultReturn;
    }
    const regexResult = ENCRYPTED_REGEX.exec(value);
    if (!regexResult?.groups?.isEncrypted) {
      return defaultReturn;
    }
    return { ...prev, [key]: getDecryptedValue(secret, regexResult.groups.value) };
  }, {});

const decrypt = (args: Arguments): void => {
  const envPath = path.join(cwd(), args.file);
  const env = dotenv.config({ path: envPath });
  if (env.error) {
    throw env.error;
  }
  if (!env.parsed) {
    throw new Error(`.env file not found at ${envPath}`);
  }

  const encEnvString = Object.entries(env.parsed).reduce((prev, [key, value]) => {
    const constantCasedKey = Case.constant(key);
    const regexResult = ENCRYPTED_REGEX.exec(value);
    if (typeof value !== "string" || !regexResult?.groups?.isEncrypted) {
      return `${prev}${constantCasedKey}=${typeof value === "string" ? `"${value}"` : value}\n`;
    }
    return `${prev}${constantCasedKey}="DEC:${getDecryptedValue(args.secret, regexResult.groups.value)}"\n`;
  }, "");

  let filePath = path.join(path.dirname(envPath), `${path.basename(envPath).replace(".enc", "")}.dec`);
  if (args.overwrite) {
    filePath = envPath;
  }
  fs.writeFileSync(filePath, encEnvString);
};

const command: CommandModule<Arguments, Arguments> = {
  command: "decrypt",
  describe: "Decrypt specified .env* file",
  builder: {
    secret: {
      alias: "S",
      nargs: 1,
      demandOption: "The secret used for encryption is required for decryption",
      describe: "Secret to use for decryption",
    },
    file: {
      alias: "F",
      nargs: 1,
      describe: "Path to .env*",
      default: ".env",
    },
  },
  handler: decrypt,
};

export default command;
