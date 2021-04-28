import { expect } from "chai";
import { exec as execute } from "child_process";
import { promisify } from "util";

const ANSI_REGEX = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
  ].join("|"),
  "g",
);
const OUTPUT_REGEX = /value:(?<value>.+)/;
const exec = promisify(execute);

describe("Encrypt then Decrypt Single Value", function (this: Mocha.Suite & { encryptedValue?: string }) {
  it("should encrypt then decrypt a specific value successfully", async function () {
    const encRes = await exec("ciphenv encrypt --value encryptMe --secret superSecret");
    const replacedEncOut = encRes.stdout.replace(ANSI_REGEX, "");

    expect(replacedEncOut).to.match(OUTPUT_REGEX).and.to.not.include("encryptMe");
    const match = replacedEncOut.match(OUTPUT_REGEX);

    const decRes = await exec(`ciphenv decrypt --value ${match!.groups!.value.trim()} --secret superSecret`);
    const replacedDecOut = decRes.stdout.replace(ANSI_REGEX, "");
    expect(replacedDecOut).to.match(/value: encryptMe/);
  });
});
