// types gathered for flasetnew and commandnew
/**
 * Types for command-line parsing and execution.
 *
 * There are a lot of lines here, and a lot of comments explaining them, but
 * they generate no executable code except for the extended error class near the
 * top.
 *
 * # Overview
 *
 * The core types/jargon to understand are:
 *
 * 1. CLI: a command-line program.
 * 2. Flag: the specification to document, identify, and parse a named
 *    single CLI flag
 * 3. Flagset: the specification to document and parse a whole set
 *    of named flags
 * 4. Positionals: CLI arguments identified by their position, not
 *    a named flag.
 * 5. Command: the specification to document and run a simple command
 *    that may have flags and positionals
 * 6. MultiCommand: the specification for an executable that can have
 *    several levels of subcommands, each which is, on it's own,
 *    a valid Command
 *
 * # Conventions
 *
 * I try to use these generic type abbreviations to mean:
 *
 * - V: the type of the parsed command line flags, what they parse to be
 * - F: the type of the Flag (flag specification) Flag<F> = FT
 * - FF: the type of a Flagset (multiple flags specification)
 * - VV: "flags," the type that a flagset parses out to
 */

import { Flagset } from "./types.ts";

/**
 * copied verbatim from @std/io to get our lib runtime deps down to zero
 */
export interface Writer {
  write(p: Uint8Array): Promise<number>;
}

/**
 * OutsFn ("Out String Function") is any async command that can take a string
 * and output it somewhere, typically stdout.
 */
export type OutsFn = (message: string) => Promise<void>;

/**
 * CLI's have to interact with terminals and piping. Splitting program output
 * from error output solves [The
 * Semi-PredicateProblem](https://en.wikipedia.org/wiki/Semipredicate_problem)
 * in an elegant and standard way. See also the [Wikipedia entry on Standard
 * Streams](https://en.wikipedia.org/wiki/Standard_streams), especially the
 * section for Standard Error.
 *
 * Yet runtimes, OS's, and compiled libraries are notorious for inconsistent
 * handling of these. Injecting this simple structure into each command tries
 * to sidestep most of those inconsistencies and encourage (or at least
 * not discourage) best practices.
 */
export type StandardOutputs = {
  /**
   * outs: "output String" writes a string to an app's main output stream
   */
  outs: OutsFn;
  /**
   * errs: "error String" writes a string to an app's error stream
   */
  errs: OutsFn;
};

export type Args = string[];
export type SubcommandPath = string[];
export type Status = Promise<number>; // cli status code

export interface BaseCommand {
  name: string;
  description: string; // short, one line
  instructions: string; // longer help, Markdown
}

export type LeafHandler<VV> = (
  flags: VV,
  args: Args,
  std: StandardOutputs,
  path: SubcommandPath,
  command: LeafCommand<VV>,
  root: Command, // might be same as .command if this is a simple CLI
) => Status;

export interface LeafCommand<VV> extends BaseCommand {
  flagset: Flagset<VV>;
  argset: string[]; // documentation for positional args TODO format for optional and rest?
  handler: LeafHandler<VV>;
}

export interface MultiCommand extends BaseCommand {
  subcommands: Record<string, Command>;
}

export type Command = LeafCommand<unknown> | MultiCommand;

interface RunContext {
  done: boolean;
  exitCode: number; // if defined, stop and return this status
  std: StandardOutputs;
  root: Command; // might be a single or multi
  path: SubcommandPath;
  args: Args;
  argPos: number;
  leaf?: LeafCommand<unknown>;
}

interface LeafContext<VV> extends RunContext {
  command: LeafCommand<VV>;
  flagsP: Partial<VV>;
  flags?: VV;
}
