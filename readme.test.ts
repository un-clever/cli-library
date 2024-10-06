// deno-lint-ignore-file no-unused-vars
// examples for Readme
import {
  booleanFlag,
  type CliArgs,
  command,
  type CommandFn,
  type Flagset,
  type FlagsetReturn,
  makeLogger,
  numberFlag,
  optional,
  type PrintFn,
  required,
  stringFlag,
} from "@un-clever/cli-library";
import { assertEquals } from "testlib";

/**
 * QUICK AND DIRTY START
 */
// a one statement Hello World in Deno
const status1 = await command(
  "hello",
  "hello command",
  { who: required("who", "who to say hello to", stringFlag, "World") },
  async (output, flags: { who: string }) => {
    await output(`Hello, ${flags.who}!`);
    return 0;
  },
).run(Deno.args);

assertEquals(status1, 0);

/**
 * SECOND QUICKSTART
 */
// lets unpack the pieces and types a bit more explicitly

// a CLI begins with a set of flags that parse to an expected type
const helloFlags = {
  who: required("who", "who to say hello to", stringFlag, "World"),
};
type HelloFlags = FlagsetReturn<typeof helloFlags>;

// then we have a function that implements our command and expects
// 1. flags like we've described
// 2. an async function that outputs strings (makes testing easier!)
// and returns an integer status code
async function helloHandler(
  output: PrintFn,
  flags: HelloFlags,
) {
  await output(JSON.stringify(flags));
  return 0; // The SHELL's idea of success!
}

// TODO: switch this to the simpler RUN interface

// we bundle those up into a Command
const helloCommand = command(
  "hello",
  "Hello command",
  helloFlags,
  helloHandler,
);

const status2 = await helloCommand.run(
  ["--who", "Abe"],
  makeLogger(Deno.stdout),
);

assertEquals(status2, 0);

/**
 * Later examples
 */

// or, if we prefer, we can start with the expected type and typecheck our flags
//
type HelloFlags2 = { who: string };
const helloFlags2: Flagset<HelloFlags2> = {
  who: required("who", "who to say hello to", stringFlag, "World"),
};

// structure of the flags we expect
interface Flags {
  verbose: boolean;
  infile: string;
  outfile?: string;
  reps: number;
}

const flags: Flagset<Flags> = {
  verbose: required("verbose", "be noisy", booleanFlag),
  infile: required("infile", "input file", stringFlag, "default.txt"),
  outfile: optional("optional", "output file (otherwise stdout)", stringFlag),
  reps: required("reps", "how many times to repeat the file", numberFlag, 1),
};

const myImpelementation: CommandFn<Flags> = async (
  write: PrintFn,
  flags: Flags,
) => {
  await write(`
    If I were a real command, I would ${
    flags.verbose ? "be VERY" : "not be"
  } noisy.
    I would read from the file, ${flags.infile}.
    I would write ${flags.reps} copies to ${flags.outfile || "STDOUT"}.`);
  return 0; // success
};

const myCommand = command(
  "catX",
  "stub file duplicator",
  flags,
  myImpelementation,
);

await myCommand.run(Deno.args);
