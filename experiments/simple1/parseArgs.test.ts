import { assertEquals, describe, it } from "testlib";
import { parseArgsDummy } from "./parseArgs.ts";

describe("basic parser", () => {
  it("does", () => {
    assertEquals(1, 1);
    assertEquals(parseArgsDummy({}, []), { thing1: "red", thing2: "also red" });
  });
});
