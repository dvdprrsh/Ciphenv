import { expect } from "chai";
import { exec as execute } from "child_process";
import dotenv from "dotenv";
import { promisify } from "util";
import { getDecryptedValues } from "../src";

const exec = promisify(execute);

function getDecEnv(type: "command" | "function" = "command") {
  return { SECRET_VALUE: type === "command" ? "DEC:encryptMe" : "encryptMe", PLAIN_VALUE: "don't encrypt me please" };
}

describe("Encrypt then Decrypt File", function () {
  describe("Encryption", function () {
    describe("Encryption command successful", function () {
      it("should run `encrypt` command", async function () {
        const res = await exec("ciphenv encrypt --file ./tests/.env --secret superSecret");
        expect(res.stderr).to.be.empty;
      });
      it("should check values have been encrypted", async function () {
        const encEnv = dotenv.config({ path: "./tests/.env.enc" }).parsed;
        expect(encEnv).to.have.keys("SECRET_VALUE", "PLAIN_VALUE");
        expect(encEnv!.SECRET_VALUE).to.match(/ENC:.+/);
        expect(encEnv!.PLAIN_VALUE).to.equal("don't encrypt me please");
      });
    });
  });

  describe("Decryption", function () {
    describe("Decryption command successful", function () {
      it("should run `decrypt` command", async function () {
        const res = await exec("ciphenv decrypt --file ./tests/.env.enc --secret superSecret");
        expect(res.stderr).to.be.empty;
      });
      it("should check values are decrypted correctly", async function () {
        const decEnv = dotenv.config({ path: "./tests/.env.dec" }).parsed;
        expect(decEnv).to.deep.equal(getDecEnv("command"));
      });
    });

    describe("Decryption function successful", function () {
      it("should use ciphenv `getDecryptedValues` to decrypt values", async function () {
        const encEnv = dotenv.config({ path: "./tests/.env.enc" }).parsed;
        expect(encEnv).to.exist;
        const decEnv = getDecryptedValues("superSecret", encEnv!);
        expect(decEnv).to.deep.equal(getDecEnv("function"));
      });
    });
  });
});
