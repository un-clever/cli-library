// this might have Deno specific stuff

import { Buffer } from "@std/io/buffer";
import { standardizeOutputs } from "../output.ts";
import type { Command, StandardOutputs } from "../types.ts";

export const defaultOutputs: StandardOutputs = standardizeOutputs(
  Deno.stdout,
  Deno.stderr,
);

export type CapturedOutput = { output: string; errOutput: string };

export type Capturer = {
  getCapture(): CapturedOutput;
};

export function makeTestOutputs(): StandardOutputs & Capturer {
  const decoder = new TextDecoder();
  const outbuf = new Buffer();
  const errbuf = new Buffer();
  const { outs, errs } = standardizeOutputs(outbuf, errbuf);

  const getCapture = () => ({
    output: decoder.decode(outbuf.bytes()),
    errOutput: decoder.decode(errbuf.bytes()),
  });

  return { outs, errs, getCapture };
}

/**
 * @param cmd
 * @param rawargs
 * @returns
 */
export async function captureRun(
  cmd: Command,
  rawargs: string[],
): Promise<CapturedOutput & { status: number }> {
  const outputs = makeTestOutputs();
  const status = await cmd.run(rawargs, outputs);
  return { ...outputs.getCapture(), status };
}
