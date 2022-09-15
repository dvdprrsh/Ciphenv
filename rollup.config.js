import typescript from "@rollup/plugin-typescript";
import path from "path";
import { defineConfig } from "rollup";
import externals from "rollup-plugin-node-externals";
import pkg from "./package.json";

const SHEBANG_REGEX = /^#!.+/;

/**
 *
 * @returns {import("rollup").Plugin}
 */
const cliEntryPlugin = () => {
  return {
    name: "cli-entry",
    renderChunk: (code, chunk) => {
      if (chunk.name !== "cli" || SHEBANG_REGEX.test(code)) return code;
      return `#!/usr/bin/env node\n${code}`;
    },
  };
};

export default defineConfig([
  {
    input: ["src/index.ts", "src/cli.ts"],
    output: {
      dir: "lib",
      format: "cjs",
      preserveModules: true,
      exports: "named",
      banner: "#!/usr/bin/env node",
      entryFileNames: (chunk) => {
        if (chunk.name === "cli") return path.basename(pkg.bin.ciphenv);
        if (chunk.isEntry) return path.basename(pkg.main);
        return "[name].cjs";
      },
    },
    plugins: [externals(), typescript(), cliEntryPlugin()],
  },
  {
    input: "src/index.ts",
    output: [
      {
        dir: "lib",
        format: "esm",
        preserveModules: true,
        entryFileNames: (chunk) => {
          if (chunk.isEntry) return path.basename(pkg.module);
          return "[name].js";
        },
      },
    ],
    plugins: [externals(), typescript()],
  },
]);
