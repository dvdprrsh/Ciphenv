import Case from "case";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { cwd } from "process";
import { CommandModule } from "yargs";
import { DECRYPTED_REGEX, getCipher, getIV, getKey, getSalt } from "./helpers";
import Logger from "./logger";
import { Arguments } from "./types";

function encrypt(args: Arguments): void {
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
    const regexResult = DECRYPTED_REGEX.exec(value);
    if (typeof value !== "string" || !regexResult?.groups?.isDecrypted) {
      return `${prev}${constantCasedKey}=${typeof value === "string" ? `"${value}"` : value}\n`;
    }
    const iv = getIV();
    const salt = getSalt();
    const cipherKey = getKey(args.secret, salt);
    const cipher = getCipher(cipherKey, iv);
    const encrypted = Buffer.concat([cipher.update(regexResult.groups.value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return `${prev}${constantCasedKey}="ENC:${Buffer.concat([salt, iv, tag, encrypted]).toString("base64")}"\n`;
  }, "");

  let filePath = path.join(path.dirname(envPath), `${path.basename(envPath)}.enc`);
  if (args.overwrite) {
    filePath = envPath;
  }
  fs.writeFileSync(filePath, encEnvString);
  Logger.info(`.env file encrypted and saved to ${filePath}`);
}

const command: CommandModule<Arguments, Arguments> = {
  command: "encrypt",
  describe: "Encrypt specified .env* file",
  builder: {
    overwrite: {
      alias: "O",
      boolean: true,
      describe: "Overwrite the specified .env file with new contents",
      default: false,
    },
    secret: {
      alias: "S",
      nargs: 1,
      demandOption: "A custom secret is required",
      describe: "Secret to use for encryption",
    },
    file: {
      alias: "F",
      nargs: 1,
      describe: "Path to .env*",
      default: ".env",
    },
  },
  handler: encrypt,
};

export default command;
