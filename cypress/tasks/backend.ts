import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);
/** Deno owns fixture SQL and refuses targets without its disposable DB marker. */
export async function backendTask(command: "seed" | "inspect", options: unknown = {}) {
  if (process.env.AIOM_TEST_MODE !== "1" || !process.env.AIOM_TEST_MARKER) {
    throw new Error("Run be-service: deno task test:system (disposable DB required)");
  }
  const cwd = process.env.AIOM_BACKEND_ROOT || path.resolve("../be-service");
  const result = await execute(process.env.DENO_BINARY || "deno", [
    "run", "--config=deno.test.json", "--allow-read", "--allow-env", "--allow-net=127.0.0.1,localhost",
    "test/helpers/fixture-cli.ts", command, JSON.stringify(options),
  ], { cwd, env: process.env, maxBuffer: 8 * 1024 * 1024 });
  return JSON.parse(result.stdout);
}
