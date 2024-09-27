import type {
  ArgList,
  CommandHandler,
  CommandMetadata,
  Env,
  ParsedArgs,
} from "./types.ts";
import type { Parser } from "./types.ts";

/**
 * Command class defines  CLI program
 */
export class Command<TArgs> {
  constructor(
    readonly metadata: CommandMetadata,
    private parser: Parser<TArgs>,
    private handler: CommandHandler<TArgs>,
  ) {
    //TODO: add tokens (aliases) to metadata and confirm no dups
    //TODO: add command aliases and match3es command predicate (aliases will be checked for dups in multicommand)
  }

  parse(arglist: ArgList, ...envs: Env[]): ParsedArgs<TArgs> {
    return this.parser(arglist, ...envs);
  }

  /**
   * Returns the usage and description of the command.
   *
   * @returns A string containing the usage and description of the command.
   */
  usage(): string {
    return `Usage: ${this.metadata.command}\n\nDescription: ${this.metadata.description}`;
  }

  help(): void {
    console.log(
      this.usage(),
      "\n\nOptions:\n" + this.metadata.optionsDocumentation,
    );
  }

  // run without help
  async runBare(rawArgs: ArgList, ...envs: Env[]): Promise<number> {
    const parsedArgs = this.parser(rawArgs, ...envs);
    return await this.handler(parsedArgs, rawArgs);
  }

  // run with help
  async run(rawArgs: ArgList, ...envs: Env[]): Promise<number> {
    if (wantsHelp(rawArgs)) {
      this.help();
      return 0;
    }
    return await this.runBare(rawArgs, ...envs);
  }
}

/**
 * @param args wantsHelp returns true if the CLI seems to be requesting help
 * @returns
 */
export function wantsHelp(args: ArgList): boolean {
  return ["help", "-h", "--help", "-?"].includes(args[0]);
}
