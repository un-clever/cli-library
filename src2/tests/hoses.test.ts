import { assertEquals, assertThrows, describe, it } from "testlib";
import { hose, HoseFn } from "../hoses.ts";
import { adder } from "./spikes/types3.test.ts";

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

export function suffixer(suffix: string) {
  return (a: string) => a + suffix;
}
export const banana = suffixer("banana");
const siphon = suffixer("siphon");

export function thrower(a: string) {
  if (a !== "") {
    throw new Error(a);
  }
  return a;
}

describe("simple pipes", () => {
  const testcases: [HoseFn<string>[], string][] = [
    [[], "fred"],
    [[banana, strUC], "FREDBANANA"],
    [[siphon, strUC], "FREDSIPHON"],
    [[strUC, siphon], "FREDsiphon"],
    [[strRev, strUC, banana, strRev], "ananabFRED"],
  ];
  for (const t of testcases) {
    const [pipes, expected] = t;
    it("tests " + expected, async () => {
      assertEquals(await hose(pipes)("fred"), expected);
    });
  }
});

const addSTOP = suffixer("STOP");

describe("haltable pipes", () => {
  const testcases: [HoseFn<string>[], string][] = [
    [[], "fred"],
    [[banana, addSTOP, strUC], "fredbananaSTOP"],
    [[banana, strUC, addSTOP], "FREDBANANASTOP"],
    [[strRev, strUC, banana, strRev, addSTOP], "ananabFREDSTOP"],
    [[strRev, strUC, banana, addSTOP, strRev], "DERFbananaSTOP"],
  ];

  for (const t of testcases) {
    const [pipes, expected] = t;
    it("tests " + expected + " halting if it ever ends with STOP", async () => {
      assertEquals(
        await hose(pipes, (a: string) => a.endsWith("STOP"))("fred"),
        expected,
      );
    });
  }
});
