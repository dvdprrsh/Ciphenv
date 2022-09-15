import { constantCase } from "constant-case";
import { parse } from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { CommandModule } from "yargs";
import Logger from "./logger";
import { Arguments } from "./types";
import {
  CiphenvError,
  createCiphenvError,
  DECRYPTED_REGEX,
  getBuilder,
  getCipher,
  getIV,
  getKey,
  getSalt,
} from "./utils";

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
    throw createCiphenvError({ error, key });
  }
}

function encryptFile(secret: string, file: string | true, replace: boolean) {
  const envPath = path.join(cwd(), typeof file === "boolean" ? ".env" : file);
  if (!fs.existsSync(envPath)) throw new Error(`${envPath} not found`);

  const env = parse(fs.readFileSync(envPath));

  const encEnvString = Object.entries(env).reduce(function (prev, [key, value]) {
    const constantCasedKey = constantCase(key);
    const regexResult = DECRYPTED_REGEX.exec(value);

    if (typeof value !== "string" || (!regexResult?.groups?.isDecrypted && !regexResult?.groups?.isDecryptedFile)) {
      return `${prev}${constantCasedKey}=${typeof value === "string" ? `"${value}"` : value}\n`;
    }

    let decryptedValue = regexResult.groups.value;
    if (regexResult.groups.isDecryptedFile) {
      const decFilePath = path.join(path.dirname(envPath), regexResult.groups.value);
      const contents = fs.readFileSync(path.normalize(decFilePath));
      decryptedValue = `${regexResult.groups.value}_PATH_END_${contents.toString()}`;
    }

    return `${prev}${constantCasedKey}="ENC:${getEncryptedValue(secret, decryptedValue, key)}"\n`;
  }, "");

  let filePath = envPath;
  if (!replace) {
    filePath = path.join(path.dirname(envPath), `${path.basename(envPath).replace(".dec", "")}.enc`);
  }
  fs.writeFileSync(filePath, encEnvString);
  return filePath;
}

export function encryptValue(secret: string, value: string) {
  return getEncryptedValue(secret, value);
}

function encrypt(args: Arguments): void {
  try {
    if (args.file) {
      const path = encryptFile(args.secret, args.file, args.replace);
      Logger.info(`.env file encrypted and saved to ${path}`);
    }
    if (args.value) {
      const value = encryptValue(args.secret, args.value);
      Logger.success("Encrypted value:", value);
    }
    Logger.success("✅ Ciphenv Completed Encryption");
  } catch (error) {
    Logger.error(error);
    if (!(error instanceof CiphenvError)) return;
    Logger.error("Error during encryption!", ...(!error.key ? [] : ["Error key:", error.key]));
  }
}

const command: CommandModule<Arguments, Arguments> = {
  command: "encrypt",
  describe: "Encrypt specified .env* file",
  builder: getBuilder("encryption"),
  handler: encrypt,
};

export default command;
