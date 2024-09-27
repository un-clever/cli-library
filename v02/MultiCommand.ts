import type { ArgList, CommandMetadata, Env } from "./types.ts";
import type { Command } from "./Command.ts";

/**
 * MultiCommand is a class that defines a CLI with multiple subcommands
 */
export class MultiCommand {
  constructor(
    private metadata: Omit<CommandMetadata, "optionsDocumentation">,
    // deno-lint-ignore no-explicit-any
    private commands: Command<any>[],
  ) {
    // TODO: confirm no duplicate command names or aliases. Handle aliases
    // TODO: add hook to allow registering more parsers
    // TODO: functional typing to extract typebox--test what it does, not it's
    // internals, such that Zod could also be used. Or lighter, isString and isNumber
  }

  usage(): string {
    return `Usage: ${this.metadata.command}\n\nDescription: ${this.metadata.description}`;
  }

  commandsHelp(): string {
    return (
      "Subcommands:\n  " +
      this.commands
        .map((c) => `${c.metadata.command}: ${c.metadata.description}`)
        .join("\n  ")
    );
  }

  help() {
    console.log(this.usage() + "\n\n" + this.commandsHelp());
  }

  async run(arglist: ArgList, ...envs: Env[]): Promise<number> {
    if (
      arglist.length === 0 ||
      ["--help", "-h", "-?", "help"].includes(arglist[0])
    ) {
      this.help();
      return 0;
    }
    const commandName = arglist[0];
    const command = this.commands.find(
      (c) => c.metadata.command === commandName,
    );
    if (!command) {
      console.log(`Unknown command: ${commandName}`);
      this.help();
      return 1;
    }
    return await command.run(arglist.slice(1), ...envs);
  }
}
