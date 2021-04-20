import { expect } from "chai";
import { exec as execute } from "child_process";
import { promisify } from "util";

const COLOUR_FILTER = /\\x1B\[\d{1,2}m/g;
const OUTPUT_REGEX = /value:(?<value>.+)/;
const exec = promisify(execute);

describe("Encrypt then Decrypt Single Value", function (this: Mocha.Suite & { encryptedValue?: string }) {
  it("should encrypt then decrypt a specific value successfully", async function () {
    const encRes = await exec("ciphenv encrypt --value encryptMe --secret superSecret");
    const encOut = encRes.stdout.replace(COLOUR_FILTER, "");

    expect(encOut).to.match(OUTPUT_REGEX).and.to.not.include("encryptMe");
    const match = encOut.match(OUTPUT_REGEX);

    console.log(match!.groups!);

    const decRes = await exec(`ciphenv decrypt --value ${match!.groups!.value} --secret superSecret`);
    const decOut = decRes.stdout.replace(COLOUR_FILTER, "");
    expect(decOut).to.match(/value:encryptMe/);
  });
});
