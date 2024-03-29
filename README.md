# Ciphenv

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/dvdprrsh/ciphenv/Build%20and%20Publish?logo=github&style=for-the-badge)](https://github.com/dvdprrsh/Ciphenv/actions?query=workflow%3A%22Build+and+Publish%22)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/dvdprrsh/Ciphenv?logo=github&style=for-the-badge)](https://github.com/dvdprrsh/Ciphenv)
![Snyk Vulnerabilities for npm package](https://img.shields.io/snyk/vulnerabilities/npm/ciphenv?logo=snyk&style=for-the-badge)
![Codacy grade](https://img.shields.io/codacy/grade/6244e596f81b48a5ba34d5aa0a8c55ff?logo=codacy&style=for-the-badge)
[![npm](https://img.shields.io/npm/dw/ciphenv?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/ciphenv)
[![npm](https://img.shields.io/npm/v/ciphenv?logo=npm&style=for-the-badge)](https://www.npmjs.com/package/ciphenv)

Ciphenv (Ciphered Env) is a simple CLI tool to encrypt/cipher your `.env` files using prefixes to indicate whether you want the value to be encrypted using a given secret.

- [Ciphenv](#ciphenv)
  - [Install](#install)
  - [Usage](#usage)
    - [Encryption](#encryption)
      - [At Runtime](#at-runtime)
      - [Using the CLI](#using-the-cli)
      - [Encrypting Entire Files](#encrypting-entire-files)
    - [Decryption](#decryption)
      - [At Runtime](#at-runtime-1)
      - [Using the CLI](#using-the-cli-1)
      - [Decrypting Entire Files](#decrypting-entire-files)
    - [CLI Options](#cli-options)

## Install

```shell
npm install --save ciphenv

or

npm install -g ciphenv
```

## Usage

Create one or many `.env` file(s) and add some values in following the [dotenv](https://www.npmjs.com/package/dotenv) pattern, e.g.

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="s1mpl32"
```

### Encryption

#### At Runtime

To encrypt at runtime Ciphenv provides the `encryptValue` utility function.

```ts
/**
 * @param secret the secret used to encrypt the values.
 * @param value the value to encrypt
 * @returns the encrypted value
 */
function encryptValue(secret: string, value: string): string;
```

Here is an example of this usage:

```js
import dotenv from "dotenv";
import { encryptValue } from "ciphenv";

function encrypt(someValue: string) {
  return encryptValue(process.env.SECRET, someValue);
}
```

#### Using the CLI

For the values that you want to be encrypted add a prefix of `DEC:` (which indicates it is decrypted) to the value. For example, taking the previous example and assuming the `DB_PASS` would want to be encrypted:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="DEC:s1mpl32"
```

Then, all that is needed is to run:

```shell
$ npx ciphenv encrypt -F --secret superSecret

# `.env.enc` file created
```

and the output in the `.env.enc` file would be:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="ENC:********"
```

#### Encrypting Entire Files

Ciphenv is also able to encrypt whole files through the use of another special prefix, being `DEC_FILE_PATH:` (path to the decrypted file). This can be especially useful for PEM keys and other multiline values that require encryption.

Following from the example above, the syntax would look like this:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="DEC:s1mpl32"
PEM="DEC_FILE_PATH:./keys/super-secret.pem"
```

after encryption, the resultant `.env` file would end up as so:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="ENC:********"
PEM="ENC:********"
```

### Decryption

#### At Runtime

To decrypt at runtime Ciphenv provides two utility functions `decryptValues` and `decryptValue`.

```ts
/**
 * @param secret the secret used to encrypt the values
 * @param env the parsed output from `dotenv` for the specified `.env*` file
 * @returns the unencrypted env object (without the `DEC:` prefix on the values)
 */
function decryptValues(secret: string, env: { [key: string]: any }): { [key: string]: any };

/**
 * @param secret the secret used to encrypt the values.
 * @param value the value to decrypt
 * @returns the decrypted value (without the `DEC:` prefix)
 */
function decryptValue(secret: string, value: string): string;
```

Here is an example of this usage:

```js
import dotenv from "dotenv";
import { decryptValues } from "ciphenv";

const config = decryptValues(process.env.SECRET, dotenv.config({ path: `.env.${NODE_ENV}.enc` }).parsed);
```

#### Using the CLI

To decrypt the encrypted `.env` file from the CLI you can then just run:

```shell
$ npx ciphenv decrypt -F --secret superSecret

# `.env.dec` file created
```

and the output would be:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="DEC:s1mpl32"
```

**Just remember to not commit the decrypted `.env` file(s)!**

Here are `.gitignore` entries which could be used to avoid committing the decrypted `.env` files when using the default naming pattern:

```text
.env.*
!.env.*.enc
```

#### Decrypting Entire Files

Decrypting entire files places the decrypted file path back in to the `.env` file like so:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="DEC:s1mpl32"
PEM="DEC_FILE_PATH:./keys/super-secret.pem"
```

and also creates the `super-secret.pem` file with it's decrypted contents again.

The above occurs partly to avoid any issues with re-encrypting the decrypted `.env` file as the value would be multiline, but also to have the behaviour that you may expect, where something decrypted should match the original used during encryption.

### CLI Options

| Option, [alias] | Description                                            | Value Type            | Default                              |
| --------------- | ------------------------------------------------------ | --------------------- | ------------------------------------ |
| `--version`     | Show version number                                    | `boolean`             |                                      |
| `-R, --replace` | Overwrite the specified `.env*` file with new contents | `boolean`             | `false`                              |
| `-S, --secret`  | Secret to use for encryption                           | `string`\*            | (required)                           |
| `-F, --file`    | Path to `.env*`                                        | `string` or `boolean` | `false` or `.env` if value is `true` |
| `-V, --value`   | Value to be encrypted                                  | `string`              |                                      |
| `-h, --help`    | Show help                                              | `boolean`             |                                      |
