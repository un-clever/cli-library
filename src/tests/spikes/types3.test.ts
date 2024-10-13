import { assertEquals, describe, it } from "testlib";
import {
  type pipeableAtoA,
  pipeAtoA,
  pipeFor2,
  pipeReducer,
  pipeReducer2,
} from "./types3.ts";

export function strUC(a: string): Promise<string> {
  return new Promise<string>((resolve) =>
    setTimeout(() => resolve(a.toUpperCase()), 0)
  );
}
export function strRev(a: string) {
  return new Promise<string>(
    (resolve) => setTimeout(() => resolve(a.split("").reverse().join("")), 0),
  );
}

export function adder(suffix: string) {
  return (a: string) => a + suffix;
}
export const banana = adder("banana");
const siphon = adder("siphon");

export function thrower(a: string) {
  if (a !== "") {
    throw new Error(a);
  }
  return a;
}

const testcases: [pipeableAtoA<string>[], string][] = [
  [[], "fred"],
  [[banana, strUC], "FREDBANANA"],
  [[siphon, strUC], "FREDSIPHON"],
  [[strUC, siphon], "FREDsiphon"],
  [[strRev, strUC, banana, strRev], "ananabFRED"],
];

describe("simple piper", () => {
  it("works", async () => {
    const pipeA = pipeAtoA<string>(banana, strUC);
    const a = await pipeA("fred");
    assertEquals(a, "FREDBANANA");
  });

  for (const t of testcases) {
    const [pipes, expected] = t;
    it("tests " + expected + " with all the implementations", async () => {
      // const b = await pipeAtoA(...pipes)("fred");
      assertEquals(await pipeAtoA(...pipes)("fred"), expected);
      assertEquals(await pipeFor2(...pipes)("fred"), expected);
      assertEquals(await pipeReducer(...pipes)("fred"), expected);
      assertEquals(await pipeReducer2(...pipes)("fred"), expected);
    });
  }

  it("handles exceptions like normal promises do", async () => {
    const fn = pipeAtoA(strRev, thrower, strUC, banana, strRev);
    try {
      const b = await fn("FRED");
      assertEquals(b, "never nope", "this shouldn't ever run");
    } catch (err) {
      assertEquals(
        err.message,
        "DERF",
        "only the first transformation should have run, and the result should be in the error message",
      );
    }
  });
});
