import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/script.ts",
  output: {
    file: "dist/script.js",
    format: "cjs",
    sourcemap: !production && "inline",
  },
  plugins: [
    nodeResolve(),
    typescript({ sourceMap: !production, inlineSources: !production }),
    production && terser(),
  ],
};
