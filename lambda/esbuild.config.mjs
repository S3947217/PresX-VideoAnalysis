import { build } from "esbuild";

await build({
  entryPoints: ["src/handler.ts"],
  bundle: true,
  outfile: "dist/handler.js",
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: false,
  minify: true,
  external: [
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/client-lambda",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-secrets-manager",
    "@aws-sdk/lib-dynamodb",
    "@aws-sdk/s3-request-presigner",
  ],
});

console.log("Build complete: dist/handler.js");
