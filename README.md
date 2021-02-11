# Ciphenv

![Build and Publish](https://github.com/dvprrsh/Ciphenv/workflows/Build%20and%20Publish/badge.svg?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/dvprrsh/Ciphenv/badge.svg?targetFile=package.json)](https://snyk.io/test/github/dvprrsh/Ciphenv?targetFile=package.json)

Cipher (Ciphered Env) is a simple CLI tool to encrypt/cipher your `.env` files using prefixes to indicate whether you want the value to be encrypted using a given secret.

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

For the values that you want to be encrypted add a prefix of `DEC:` (which indicates it is decrypted) to the value. For example, taking the previous example and assuming the `DB_PASS` would want to be encrypted:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="DEC:s1mpl3"
```

Then, all that is needed is to run:

```shell
$ npx ciphenv encrypt --secret superSecret

# `.env.enc` file created
```

and the output in the `.env.enc` file would be:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="ENC:********"
```

### Decryption

#### At Runtime

To decrypt at runtime Ciphenv provides two utility functions `getDecryptedValues` and `getDecryptedValue`.

```ts
/**
 * @param secret the secret used to encrypt the values
 * @param env the parsed output from `dotenv` for the specified `.env*` file
 * @returns the unencrypted env object (without the `DEC:` prefix on the values)
 */
function getDecryptedValues(secret: string, env: { [key: string]: any }): { [key: string]: any };

/**
 * @param secret the secret used to encrypt the values.
 * @param value the value to decrypt
 * @returns the decrypted value (without the `DEC:` prefix)
 */
function getDecryptedValue(secret: string, value: string): string;
```

Here is an example of this usage:

```js
import dotenv from "dotenv";
import { getDecryptedValues } from "ciphenv";

const config = getDecryptedValues(process.env.SECRET, dotenv.config({ path: `.env.${NODE_ENV}.enc` }).parsed);
```

#### Using the CLI

To decrypt the encrypted `.env` file from the CLI you can then just run:

```shell
$ npx ciphenv decrypt --secret superSecret

# `.env.dec` file created
```

and the output would be:

```text
DB_HOST="localhost"
DB_USER="root"
DB_PASS="DEC:s1mpl3"
```

**Just remember to not commit the decrypted `.env` file(s)!**

### CLI Options

| Option, [alias]   | Description                                            | Value Type | Default      |
| ----------------- | ------------------------------------------------------ | ---------- | ------------ |
| `--version`       | Show version number                                    | `boolean`  |              |
| `-O, --overwrite` | Overwrite the specified `.env*` file with new contents | `boolean`  | `false`      |
| `-S, --secret`    | Secret to use for encryption                           | `string`\* | (required)   |
| `-F, --file`      | Path to `.env*`                                        | `string`   | `{CWD}/.env` |
| `-h, --help`      | Show help                                              | `boolean`  |              |
