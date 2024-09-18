/**
 * Parsed Args
 */
interface Pargs<F> {
  args: string[]; // positional args
  dashdash?: string[]; // args after --
  flags: F;
}

/**
 * Single commands and multi-commands both present this functional interface.
 * Implementations may compose them from different data structures
 * And add methods to build the command. A checker can be added for tests
 * to walk the tree and check for discrepancies, I don't think we
 * make flags hierarchical we could easily switch it I suppose.
 * Typebox and Zod facades can be added
 * I'll start with a light no deps parser.
 * typings for multicommands are a little unclear, they might need an
 * expanded interface, with getSubcommand<F>(args) => {tail, command<F>}
 */
export interface Command<Flags> {
  slug: () => string;
  description: () => string;
  help: () => string;
  parse: (args: string[]) => Pargs<Flags>;
  execute: (args: Pargs<Flags>) => Promise<number>; // exit status

  // utility mothods
  output: (text: string) => Promise<void>;
  flagNames: () => string[]; // for sanity checks
  // deno-lint-ignore no-explicit-any
  subcommands: () => Command<any>[]; // to walk tree for sanity checks, if this is a leaf commanad, this is an empty array
}

export async function run<T>(cmd: Command<T>, args: string[]) {
  try {
    const pargs = cmd.parse(args);
    const exitCode = await cmd.execute(pargs);
    // warn if exit code? No function should except
    return Deno.exit(exitCode);
  } catch (err) {
    // await cmd.output(cmd.help())
    console.error("ERROR", err.message);
    console.error(`Run '${cmd.slug()} --help' for more information.`);
  }
}
