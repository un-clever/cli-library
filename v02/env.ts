import { Env } from "./types.ts";

/**
 * Retrieves the value of the specified environment variable from the given array of environments.
 * If the variable is not found, the default value is returned.
 *
 * @param key - The name of the environment variable to retrieve.
 * @param envs - An array of environments to search for the variable. EARLIER takes precedence (FIRST wins)
 * @param defaultValue - The default value to return if the variable is not found. (optional)
 * @returns The value of the environment variable, or the default value if not found.
 */
export function getEnv(
  key: string,
  envs: Env[],
  defaultValue?: string
): string | undefined {
  for (const env of envs) {
    if (env[key]) return env[key];
  }
  return defaultValue;
}

export function mustGetEnv(
  key: string,
  description: string,
  envs: Env[],
  defaultValue?: string
) {
  const value = getEnv(key, envs, defaultValue);
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${key} (${description})`
    );
  }
  return value;
}
