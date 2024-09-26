// deno-lint-ignore-file no-unused-vars
import {
  assert,
  assertEquals,
  assertFalse,
  assertType,
  describe,
  type IsExact,
  it,
} from "testlib";
import { dashDashCases } from "./testData.ts";
import type { CliArgs } from "../types.ts";

describe("dashdash examples", () => {
  for (const c of dashDashCases) {
    // test if error correct or not
    if (c.raw.length > 0 && c.raw[c.raw.length - 1] === "--") {
      it("expects errors when -- is the last param", () => {
        assert(
          c.parsed instanceof Error,
          `expected ${JSON.stringify(c.raw)} to except`,
        );
      });
    } else {
      it("expects no errors when -- is not the last param", () => {
        assertFalse(c.parsed instanceof Error, "shouldn't expect error");
        const { args, dashdash } = c.parsed as CliArgs<unknown>;
        assertEquals(
          [...args, "--", ...dashdash],
          c.raw,
          "args should concat with -- to match input",
        );
      });
    }
  }
});
