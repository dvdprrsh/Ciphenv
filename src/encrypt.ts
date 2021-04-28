import Case from "case";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { CommandModule } from "yargs";
import { DECRYPTED_REGEX, getBuilder, getCipher, getIV, getKey, getSalt } from "./helpers";
import Logger from "./logger";
import { Arguments } from "./types";

function getEncryptedValue(secret: string, value: string, key?: string) {
  try {
    const iv = getIV();
    const salt = getSalt();
    const cipherKey = getKey(secret, salt);
    const cipher = getCipher(cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
  } catch (error) {
    Logger.error("Error during encryption!", ...(!key ? [] : ["Error key:", key]));
    throw error;
  }
}

function encryptFile(secret: string, file: string | true, replace: boolean) {
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
    const regexResult = DECRYPTED_REGEX.exec(value);
    if (typeof value !== "string" || !regexResult?.groups?.isDecrypted) {
      return `${prev}${constantCasedKey}=${typeof value === "string" ? `"${value}"` : value}\n`;
    }
    return `${prev}${constantCasedKey}="ENC:${getEncryptedValue(secret, regexResult.groups.value, key)}"\n`;
  }, "");

  let filePath = path.join(path.dirname(envPath), `${path.basename(envPath).replace(".dec", "")}.enc`);
  if (replace) {
    filePath = envPath;
  }
  fs.writeFileSync(filePath, encEnvString);
  Logger.info(`.env file encrypted and saved to ${filePath}`);
}

function encryptValue(secret: string, value: string) {
  const encrypted = getEncryptedValue(secret, value);
  Logger.success("Encrypted value:", encrypted);
}

function encrypt(args: Arguments): void {
  if (args.file) {
    encryptFile(args.secret, args.file, args.replace);
  }
  if (args.value) {
    encryptValue(args.secret, args.value);
  }
  Logger.success("✅ Ciphenv Completed Encryption");
}

const command: CommandModule<Arguments, Arguments> = {
  command: "encrypt",
  describe: "Encrypt specified .env* file",
  builder: {
    ...getBuilder("encryption"),
  },
  handler: encrypt,
};

export default command;
