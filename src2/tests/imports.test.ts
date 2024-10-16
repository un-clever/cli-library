import { assert, describe, it } from "testlib";
import * as path from "jsr:@std/path";
import { AssertionError } from "@std/assert";

const nonLocalImports = /(^import .*? from "[^.].*?";$)/sgm;

function assertOnlyLocalImports(code: string) {
  const problems: string[] = [];
  for (const match of code.matchAll(nonLocalImports)) {
    problems.push(match.toString());
  }
  if (problems.length < 1) return;
  // const msg = matches.map((m: RegExpExecArray) => m[0]);
  throw new AssertionError(
    `Code has ${problems.length} non-local imports\n` + problems.join("\n"),
  );
}

describe("the library runtime has no external dependencies", () => {
  // const thisDir = import.meta.dirname;
  // const libDir = path.dirname(thisDir);
  const libdir = path.fromFileUrl(import.meta.resolve("../"));
  const filenames = Array.from(Deno.readDirSync(libdir)).map((entry) =>
    entry.name
  );
  // const tsFiles =
  it("we can grab the right file names", () => {
    assert(libdir.endsWith("cli-library/src/"));
    // assertEquals(filenames, []);
    assert(filenames.includes("command.ts"));
  });
  for (const fn of filenames) {
    if (!fn.endsWith(".ts")) {
      console.debug("skipping", fn);
      continue;
    }
    it(`${fn} only has local imports`, async () => {
      const fullpath = path.fromFileUrl(import.meta.resolve("../" + fn));
      const code = await Deno.readTextFile(fullpath);
      // assertEquals(code, "");
      assertOnlyLocalImports(code);
    });
  }
});
