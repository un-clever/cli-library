import { assert, assertEquals, assertFalse, describe, it } from "testlib";
import { dashDashCases } from "./testData.ts";
import type { CliArgs } from "../types.ts";

describe(`we have ${dashDashCases.length} reliable dashdash examples`, () => {
  it("...expect an error because -- is the last param", () => {
    for (const c of dashDashCases) {
      if (c.raw.length > 0 && c.raw[c.raw.length - 1] === "--") {
        assert(
          c.parsed instanceof Error,
          `expected ${JSON.stringify(c.raw)} to except`,
        );
      }
    }
  });
  it("...expect a consistent parse", () => {
    for (const c of dashDashCases) {
      if (c.raw.length < 1 || c.raw[c.raw.length - 1] !== "--") {
        assertFalse(c.parsed instanceof Error, "shouldn't expect error");
        const { args, dashdash } = c.parsed as CliArgs<unknown>;
        assertEquals(
          [...args, "--", ...dashdash],
          c.raw,
          "args should concat with -- to match input",
        );
      }
    }
  });
});
