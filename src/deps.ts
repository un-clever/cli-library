// dependency import for Deno, split into an import map when supporting other runtimes
export {
  FormatRegistry,
  Type,
  type Static,
  type TObject,
  type TSchema,
  type TransformFunction,
} from "npm:@sinclair/typebox@0.32.31";
export { Value } from "npm:@sinclair/typebox@0.32.31/value";
// export { z } from "npm:zod@v3.23.8";
export { parseArgs, type ParseOptions } from "jsr:@std/cli@0.224.4/parse-args";
