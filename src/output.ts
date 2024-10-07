import type { StandardOutputs, Writer } from "./types.ts";

export function standardizeOutputs(
  outputStream: Writer,
  errorStream: Writer,
): StandardOutputs {
  const encoder = new TextEncoder();

  async function writeAllString(w: Writer, s: string): Promise<void> { // derived from @std/io/write-all
    const data = encoder.encode(s);
    let n = 0;
    while (n < data.length) n += await w.write(data.subarray(n));
  }
  return {
    out: (s: string) => writeAllString(outputStream, s),
    err: (s: string) => writeAllString(errorStream, s),
  };
}
