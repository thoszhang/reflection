import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: "src/script1.ts",
    output: {
      file: "dist/1/script.js",
      format: "cjs",
      sourcemap: !production && "inline",
    },
    plugins: [
      nodeResolve(),
      typescript({ sourceMap: !production, inlineSources: !production }),
      production && terser(),
    ],
  },
  {
    input: "src/script2.ts",
    output: {
      file: "dist/2/script.js",
      format: "cjs",
      sourcemap: !production && "inline",
    },
    plugins: [
      nodeResolve(),
      typescript({ sourceMap: !production, inlineSources: !production }),
      production && terser(),
    ],
  },
];
