// deno-lint-ignore-file no-unused-vars
// import * as T from "./types.ts";
import { assertType, it } from "testlib";
import type { Has, IsExact } from "testlib";
import type {
  Flag,
  FlagReturn,
  Flagset,
  FlagsetReturn,
  FlagValue,
  OptionalFlag,
  RequiredFlag,
} from "../types.ts";
import type { Writer } from "../output.ts";
import { describe } from "@std/testing/bdd";
import { getTestFlagset, type TtestFlagsetReturn } from "./testUtils.ts";
import type { Writer as StandardWriter } from "@std/io";

describe("Type assertions look strange at first, but they work", () => {
  assertType<IsExact<string, string>>(true);
  assertType<IsExact<string, number>>(false);
});
describe("Our copied version of @std/io.Writer matches the standard", () => {
  assertType<IsExact<Writer, StandardWriter>>(true);
});

describe("we can strongly type flags", () => {
  const { one, dos, three, four, cinco } = getTestFlagset();
  it("We can strongly type the flags with assignments", () => {
    const oneTyped: Flag<string> = one;
    const dosTyped: Flag<string> = dos;
    const threeTyped: Flag<boolean> = three;
    const fourTyped: Flag<number> = four;
    const cincoTyped: Flag<number> = cinco;
  });
  it("We can strongly type the flags with assertions", () => {
    assertType<Has<Flag<string>, typeof one>>(true);
    assertType<Has<Flag<string>, typeof dos>>(true);
    assertType<Has<Flag<boolean>, typeof three>>(true);
    assertType<Has<Flag<number>, typeof four>>(true);
    assertType<Has<Flag<number>, typeof cinco>>(true);
  });
  it("and the assertions are strict enough to catch mistakes of type", () => {
    assertType<Has<Flag<number>, typeof one>>(false);
    assertType<Has<Flag<boolean>, typeof dos>>(false);
    assertType<Has<Flag<number>, typeof three>>(false);
    assertType<Has<Flag<string>, typeof three>>(false);
    assertType<Has<Flag<boolean>, typeof four>>(false);
    assertType<Has<Flag<string>, typeof cinco>>(false);
  });
  it("and distinguish required from optional", () => {
    assertType<Has<RequiredFlag<string>, typeof one>>(false);
    assertType<Has<OptionalFlag<string>, typeof dos>>(false);
    assertType<Has<RequiredFlag<boolean>, typeof three>>(false);
    assertType<Has<RequiredFlag<number>, typeof four>>(false);
    assertType<Has<OptionalFlag<number>, typeof cinco>>(false);
  });
});

describe("we can extract the types of a flag", () => {
  const { one, dos, three, four, cinco } = getTestFlagset();
  it("extracts what TypeScript type a flag parses into", () => {
    assertType<IsExact<FlagValue<typeof one>, string>>(true);
    assertType<IsExact<FlagValue<typeof dos>, string>>(true);
    assertType<IsExact<FlagValue<typeof three>, boolean>>(true);
    assertType<IsExact<FlagValue<typeof four>, number>>(true);
    assertType<IsExact<FlagValue<typeof cinco>, number>>(true);
  });
  it("extracts what TypeScript type a flag might be in a set of flags, taking into account that optional flags might be undefined", () => {
    assertType<IsExact<FlagReturn<typeof one>, string | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof dos>, string>>(true);
    assertType<IsExact<FlagReturn<typeof three>, boolean | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof four>, number | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof cinco>, number>>(true);
  });
  it("and the extractions are specific enough to catch mistakes", () => {
    assertType<IsExact<FlagValue<typeof one>, boolean>>(false);
    assertType<IsExact<FlagValue<typeof dos>, number>>(false);
    assertType<IsExact<FlagValue<typeof three>, number>>(false);
    assertType<IsExact<FlagValue<typeof three>, string>>(false);
    assertType<IsExact<FlagValue<typeof four>, string>>(false);
    assertType<IsExact<FlagValue<typeof cinco>, boolean>>(false);

    assertType<IsExact<FlagReturn<typeof one>, string>>(false);
    assertType<IsExact<FlagReturn<typeof dos>, string | undefined>>(false);
    assertType<IsExact<FlagReturn<typeof three>, boolean>>(false);
    assertType<IsExact<FlagReturn<typeof four>, number>>(false);
    assertType<IsExact<FlagReturn<typeof cinco>, number | undefined>>(false);
  });
});

describe("we can strongly type sets of flags", () => {
  const flagset = getTestFlagset();
  type flagsetT = typeof flagset;

  type chk1 = Flagset<TtestFlagsetReturn>;

  it("strongly types the flagset", () => {
    assertType<IsExact<flagsetT, Flagset<TtestFlagsetReturn>>>(true);

    // here's a variation with only optionals
    assertType<
      IsExact<
        { one: OptionalFlag<string>; four: OptionalFlag<number> },
        Flagset<{ one?: string; four?: number }>
      >
    >(
      true,
    );
    // ...and proof that it's exact (omitting the optional ? on .four)
    assertType<
      IsExact<
        { one: OptionalFlag<string>; four: OptionalFlag<number> },
        Flagset<{ one?: string; four: number }>
      >
    >(
      false,
    );
    // here's a variation with only requireds
    assertType<
      IsExact<
        { one: RequiredFlag<string>; four: RequiredFlag<number> },
        Flagset<{ one: string; four: number }>
      >
    >(
      true,
    );
    // ...and proof that it's exact (adding the optional ? on .four)
    assertType<
      IsExact<
        { one: RequiredFlag<string>; four: RequiredFlag<number> },
        Flagset<{ one: string; four?: number }>
      >
    >(
      false,
    );
  });

  it("can extract the type a flagset will parse to", () => {
    assertType<IsExact<FlagsetReturn<flagsetT>, TtestFlagsetReturn>>(true);
  });
});
