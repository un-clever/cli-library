// deno-lint-ignore-file no-unused-vars
// import * as T from "./types.ts";
import { assertType, it } from "testlib";
import type { Has, IsExact } from "testlib";
import type {
  Flag,
  FlagReturn,
  Flagset,
  FlagsetReturn,
  FlagType,
  OptionalFlag,
  RequiredFlag,
} from "./types.ts";
import { booleanFlag, floatFlag, intFlag, stringFlag } from "./flagParsers.ts";
import { describe } from "@std/testing/bdd";

describe("Type assertions look strange at first, but they work", () => {
  assertType<IsExact<string, string>>(true);
  assertType<IsExact<string, number>>(false);
});

/**
 * start with some hard-coded flags
 */
function getFlagset() {
  const one: OptionalFlag<string> = {
    name: "one",
    description: "your optional string argument",
    required: false,
    parser: stringFlag,
  };

  const dos: RequiredFlag<string> = {
    name: "dos",
    description: "your required string",
    required: true,
    parser: stringFlag,
  };

  const three: OptionalFlag<boolean> = {
    name: "three",
    description: "your optional boolean flag (booleans must be optional)",
    required: false,
    parser: booleanFlag,
  };

  const four: OptionalFlag<number> = {
    name: "four",
    description: "your optional float flag",
    required: false,
    parser: floatFlag,
  };

  const cinco: RequiredFlag<number> = {
    name: "cinco",
    description: "your required int flag",
    required: true,
    parser: intFlag,
  };

  // an untyped flagset
  return { one, dos, three, four, cinco };
}

type flagsetReturn = {
  one?: string;
  dos: string;
  three?: boolean;
  four?: number;
  cinco: number;
};

describe("we can strongly type flags", () => {
  const { one, dos, three, four, cinco } = getFlagset();
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
  const { one, dos, three, four, cinco } = getFlagset();
  it("extracts what TypeScript type a flag parses into", () => {
    assertType<IsExact<FlagType<typeof one>, string>>(true);
    assertType<IsExact<FlagType<typeof dos>, string>>(true);
    assertType<IsExact<FlagType<typeof three>, boolean>>(true);
    assertType<IsExact<FlagType<typeof four>, number>>(true);
    assertType<IsExact<FlagType<typeof cinco>, number>>(true);
  });
  it("extracts what TypeScript type a flag might be in a set of flags, taking into account that optional flags might be undefined", () => {
    assertType<IsExact<FlagReturn<typeof one>, string | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof dos>, string>>(true);
    assertType<IsExact<FlagReturn<typeof three>, boolean | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof four>, number | undefined>>(true);
    assertType<IsExact<FlagReturn<typeof cinco>, number>>(true);
  });
  it("and the extractions are specific enough to catch mistakes", () => {
    assertType<IsExact<FlagType<typeof one>, boolean>>(false);
    assertType<IsExact<FlagType<typeof dos>, number>>(false);
    assertType<IsExact<FlagType<typeof three>, number>>(false);
    assertType<IsExact<FlagType<typeof three>, string>>(false);
    assertType<IsExact<FlagType<typeof four>, string>>(false);
    assertType<IsExact<FlagType<typeof cinco>, boolean>>(false);

    assertType<IsExact<FlagReturn<typeof one>, string>>(false);
    assertType<IsExact<FlagReturn<typeof dos>, string | undefined>>(false);
    assertType<IsExact<FlagReturn<typeof three>, boolean>>(false);
    assertType<IsExact<FlagReturn<typeof four>, number>>(false);
    assertType<IsExact<FlagReturn<typeof cinco>, number | undefined>>(false);
  });
});

describe("we can strongly type sets of flags", () => {
  const flagset = getFlagset();
  type flagsetT = typeof flagset;

  type chk1 = Flagset<flagsetReturn>;

  it("strongly types the flagset", () => {
    assertType<IsExact<flagsetT, Flagset<flagsetReturn>>>(true);

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
    assertType<IsExact<FlagsetReturn<flagsetT>, flagsetReturn>>(true);
  });
});
