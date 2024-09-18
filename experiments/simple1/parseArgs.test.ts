import { assertEquals, describe, it } from "testlib";
import { parseArgs } from "./parseArgs.ts";

describe("basic parser", () => {
  it("does", () => {
    assertEquals(1, 1);
    assertEquals(parseArgs({}, []), { thing1: "red", thing2: "also red" });
  });
});
