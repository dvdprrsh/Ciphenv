import typescript from "@rollup/plugin-typescript";
import path from "path";
import { defineConfig } from "rollup";
import externals from "rollup-plugin-node-externals";
import pkg from "./package.json";

export default defineConfig([
  {
    input: ["src/index.ts", "src/cli.ts"],
    output: [
      {
        dir: "lib",
        format: "cjs",
        entryFileNames: (chunk) => {
          if (chunk.name === "cli") return path.basename(pkg.bin.ciphenv);
          if (chunk.isEntry) return path.basename(pkg.main);
          return "[name].cjs";
        },
        preserveModules: true,
        exports: "named",
      },
    ],
    plugins: [externals(), typescript()],
  },
  {
    input: "src/index.ts",
    output: [
      {
        dir: "lib",
        format: "esm",
        entryFileNames: (chunk) => {
          if (chunk.isEntry) return path.basename(pkg.module);
          return "[name].js";
        },
        preserveModules: true,
      },
    ],
    plugins: [externals(), typescript()],
  },
]);
