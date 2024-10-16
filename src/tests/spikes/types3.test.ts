import { assertEquals, describe, it } from "testlib";
import {
  haltify,
  type pipeableAtoA,
  PipeableBtoB,
  pipeAtoA,
  pipeBtoB,
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
      const pipesB: PipeableBtoB<string>[] = pipes.map(haltify);
      assertEquals(await pipeAtoA(...pipes)("fred"), expected);
      assertEquals(await pipeFor2(...pipes)("fred"), expected);
      assertEquals(await pipeReducer(...pipes)("fred"), expected);
      assertEquals(await pipeReducer2(...pipes)("fred"), expected);
      assertEquals((await pipeBtoB(...pipesB)("fred"))[0], expected);
    });
  }

  it("handles exceptions like normal promises do", async () => {
    const fn = pipeAtoA(strRev, thrower, strUC, banana, strRev);
    try {
      const b = await fn("FRED");
      assertEquals(b, "never nope", "this shouldn't ever run");
    } catch (err) {
      assertEquals(
        (err as Error).message,
        "DERF",
        "only the first transformation should have run, and the result should be in the error message",
      );
    }
  });

  const haltableUc = haltify(strUC);
  const haltableRev = haltify(strRev);
  const haltableBanana = haltify(banana);

  it("has a big brother that handles bailing out early", async () => {
    assertEquals((await pipeBtoB()("fred"))[0], "fred");
    assertEquals(await haltableUc("fred"), ["FRED"]);
    assertEquals(await haltableRev("fred"), ["derf"]);
    assertEquals(await haltableBanana("fred"), ["fredbanana"]);
    assertEquals((await pipeBtoB(haltableUc)("fred"))[0], "FRED");
    assertEquals((await pipeBtoB(haltableRev)("fred"))[0], "derf");
    assertEquals((await pipeBtoB(haltableBanana)("fred"))[0], "fredbanana");
    assertEquals(
      (await pipeBtoB(haltableRev, haltableBanana)("fred"))[0],
      "derfbanana",
    );
  });
});
