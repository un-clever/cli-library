import { parseArgs, type ParseOptions } from "@std/cli";
import {
  FormatRegistry,
  type Static,
  type TObject,
  type TSchema,
} from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import type { ArgList, CommandHandler, Env, Parser } from "./types.ts";
import { Command } from "./Command.ts";

/**
 * Add some key types to Typebox
 */
export function initializeTypebox(): void {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  FormatRegistry.Set("date", (v) => dateRegex.test(v));
  FormatRegistry.Set("uri", (v) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  });
}

// export const CustomDateDecoder: TransformFunction<string, Date> = (
//   str: string
// ) => {
//   const [year, month, day] = str.split("-").map((str) => parseInt(str));
//   return new Date(year, month, day);
// };

// export const CustomDateEncoder: TransformFunction<Date, string> = (
//   date: Date
// ) => {
//   const year = date.getUTCFullYear();
//   const month = String(date.getUTCMonth() + 1).padStart(2, "0");
//   const day = String(date.getUTCDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };

// // DON'T USE THIS because TIMEZONES make it really non-intuitive
// export const CustomDate = Type.Transform(Type.String())
//   .Decode(CustomDateDecoder)
//   .Encode(CustomDateEncoder);

// CLI Handler receives a parsed args object and returns an exit code
type TypeboxHandler<S extends TObject> = CommandHandler<Static<S>>;

// turns a title into a list of command-line arg tokens, tokens, excluding those that start with "KEY:"
// e.g. "-c,--command,KEY:PREFIX_COMMAND_NAME" -> ["-c", "--command"]
function argTokens(proptitle: string): string[] {
  return proptitle.split(",").filter((s) => !s.startsWith("KEY:"));
}

// turns a property name and a property schema into a pair of strings for use in a command-line help message
function cliArgSpecs(propname: string, prop: TSchema): string[] {
  if (prop.title) {
    const specs = argTokens(prop.title).join(", ");
    let d = prop.description || "";
    if (prop.default) d += ` (default: ${prop.default})`;
    if (prop.required) d += " (required)";
    // TODO: add environment variable help and required, default
    return [specs, d];
  }

  return [propname, "NEEDS A .TITLE PROPERTY"];
}

/**
 * Generate help for one option in a Typebox schema
 * @param schema
 * @returns
 */
export function typeboxOptionDocumentation<S extends TObject>(
  schema: S,
): string {
  const properties = Object.entries(schema.properties).map(([propname, prop]) =>
    cliArgSpecs(propname, prop)
  );
  return properties
    .map(([specs, description]) => `  ${specs}: ${description}`)
    .join("\n");
}

/**
 * @param commandSchema turn a typebox schema into a command
 * @param handler
 * @param semver
 * @returns
 */
export function typeboxCommand<S extends TObject>(
  commandSchema: S,
  handler: TypeboxHandler<S>,
  semver = "0.0.0",
): Command<Static<S>> {
  const parser = typeboxParser(commandSchema);
  const command = commandSchema.title
    ? commandSchema.title.split(",")[0]
    : "PLEASE SET COMMAND_SCHEMA.TITLE";
  const description = commandSchema.description || "";
  const optionsDocumentation = typeboxOptionDocumentation(commandSchema);
  return new Command(
    { command, semver, description, optionsDocumentation },
    parser,
    handler,
  );
}

// DENO SPECIFIC CODE

/**
 * turns a typebox schema into a minimist parse options object
 * @param t
 * @returns
 */
export function toParseArgsOptions(t: TObject): ParseOptions {
  const stringOptions: string[] = [];
  const booleanOptions: string[] = [];
  // deno-lint-ignore no-explicit-any
  const optionDefaults: Record<string, any> = {};
  const aliases: Record<string, string[]> = {};

  for (const [propname, prop] of Object.entries(t.properties)) {
    // parse out aliases here too
    switch (prop.type) {
      // TODO add coercions for other types
      case "number":
        break; // base typebox doesn't coerce number strings to numbers
      case "string":
        stringOptions.push(propname);
        break;
      case "boolean":
        booleanOptions.push(propname);
        break;
      default:
        throw new Error(`Add support for type: ${prop.type}`);
    }

    if (prop.default) {
      optionDefaults[propname] = prop.default;
    }
    if (prop.title) {
      const tokens = argTokens(prop.title)
        .map((s) => s.replace(/^-+/, ""))
        .filter((s) => s !== propname);
      if (tokens.length > 0) {
        aliases[propname] = tokens;
      }
    }
    // we'll handle required during parsing; I don't see how minimist would handle it
  }
  return {
    "--": true,
    string: stringOptions,
    boolean: booleanOptions,
    default: optionDefaults,
    alias: aliases,
  };
}

// This is a stub implementation of a parser for typebox schemas
/**
 * A rudimentary CLI parser
 * @param schema
 * @returns
 */
export function typeboxParser<S extends TObject>(schema: S): Parser<Static<S>> {
  initializeTypebox();
  return (raw: ArgList, ..._envs: Env[]) => {
    const options = toParseArgsOptions(schema);
    // TODO treat "" args as null (empty string args validate now, add test)
    const args = parseArgs(raw, options);
    const parsed = Value.Cast(schema, Value.Clean(schema, args));
    if (Value.Check(schema, args)) {
      return {
        raw,
        parsed, // coerced, validated and with extra properties removed
        positional: args._ || [],
        afterDashDash: args["--"] || [],
      };
    } else {
      const errors = Value.Errors(schema, args);
      let message = `Invalid arguments trying to parse CLI:`;
      for (const error of errors) {
        message += `\n  - ${error.path}: ${error.message}`;
      }
      throw new Error(message);
    }
  };
}
