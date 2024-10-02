# Un-Clever Command Line App Library

Status: informative, tiny, growingly unstable.

This library emphasizes simple maintainability for your tools:

- Slim on cognitive overhead: Easy to come back to
- Slim on code: minimal executable lines
- Slim on deps: no dependencies in the core library (some libs used in testing)
- Strong types, tests, and docs.
- Orthagonal: grow simple commands into multi-command libs
- Cross runtime: because who know where the wind will blow?

This is not a library for the prettiest CLI's; it's a library for sane, maintainable tools.

## Quick Start

```ts
// a one statement Hello World in Deno
import { command, required, runCommand, stringFlag } from "@un-clever/cli-library";

await runCommand(
  command({
    description: "hello command",
    flags: { who: required("who", "who to say hello to", stringFlag, "World") },
    run: async (args: { flags: { who: string } }, output) =>
      await output(`Hello, ${args.flags.who}!`),
  }),
  Deno.args,
  Deno.stdout,
);
```

## Okay, why isn't this getting checked

Underneath that simplicitly lays some strong typing and a structure that lends itself to composition and iterative enhancement.

```ts
// lets unpack the pieces and types a bit more explicitly

// a CLI begins with a set of flags that parse to an expected type
const helloFlags = {
  who: required("who", "who to say hello to", stringFlag, "World"),
};
type HelloFlags = FlagsetRRRReturn<typeof helloFlags>;

// then we have a function that implements our command and expects
// 1. flags like we've described
// 2. an async function that outputs strings (makes testing easier!)
// and returns an integer status code
async function helloHandler(
  cliArgs: { flags: SHelloFlags },
  output: StringOutput,
) {
  await output(JSON.stringify(cliArgs));
  return 0; // The SHELL's idea of success!
}

// TODO: switch this to the simpler RUN interface

// we bundle those up into a Command
const helloCommand = command({
  description: "Hello command",
  flags: helloFlags,
  run: helloHandler,
});
``

## Philosophy

Here's the basic concept. An un-clever CLI command has

- *Parser*: a function that takes a `string[]`, parses that string array as command line args into a simple structure.
- *Handler*: an async function that accepts a such a structure and does the job and returns an integer exit code.
- *Help*: a string to print out describing the command and it's arguments
- *Version*: a semver of the CLI because semantic versioning is *very good*.

Such commands can easily be combined into an un-clever Multi-CLI that has can list or execute the subcommands.

## Bonus Material

### Cross-Runtime Testing

I find myself having to use Node, Bun, Deno, and CloudFlare workers. I want to write CLI tools to support my work without making it a major endeavor to switch runtimes, tweak a tool after not looking at it for a year, etc.

This library showcases some ways to do that.

### Future Plans

- Optionally read args from environment variables
- Optionally read args from .env or config files
- Optionally type positional arguments
- Confirm that there aren't duplicate commands or arg aliases
- Add single-dash chains (e.g. the `-rf` in `rm -rf`).

### Alternatives

In 2024 I've looked at:

- Commander: battle-tested
- CAC (Command and Conquer)
- Clipanion: powers yarn, nice, seems to work with Deno. It uses that `class` keyword some misguided coders think is evil (while they proceed to write bad OOP without using the `class` keyword).
- Clerc: nice functional approach, seems to work with Deno. At the time I looked at it, the docs were slim but growing.
- Cliffy: nice, seems to be a Deno-only framework
- OCLI: from SalesForce, looks complicated, reliable, and well-tooled
- Lesy
- Yargs
- Built in libs for Deno, Bun, Node

They all have their own tradeoffs and do a lot more than this package does. I would use them for my occasional CLI's except that:

- Some of them have too many dependencies.
- Few of them let me grow from single-commands to multiple commands easily.
- They all want me to learn their own take on schema validation, and I just want to whatever popular validation framework my larger project is using.
- My CLI's don't need a built-in eventing library. If they do, I'll add that to the handler functions.
