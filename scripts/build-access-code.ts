#!/usr/bin/env node
// Build-time step: turns the one configured access code (env var, never
// committed) into a SHA-256 hash baked into the client bundle. Changing the
// product's access code means changing SCHOLARSHIP_QUEST_ACCESS_CODE in
// .env.local and rebuilding - nothing else in the codebase references it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeAccessCode, sha256Hex } from "../src/lib/access";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "data", "generated");

const DEV_FALLBACK_CODE = "SQ-2026-DEMO";

// Minimal ".env.local" reader (KEY=VALUE per line, # comments, optional
// quotes) - this is the only env var this script needs, so a full dotenv
// dependency would be more surface area than the problem calls for.
function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const vars: Record<string, string> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

async function main() {
  const envFromFile = readEnvFile(join(ROOT, ".env.local"));
  let code = process.env.SCHOLARSHIP_QUEST_ACCESS_CODE ?? envFromFile.SCHOLARSHIP_QUEST_ACCESS_CODE;
  if (!code) {
    console.warn(
      `SCHOLARSHIP_QUEST_ACCESS_CODE is not set - using a placeholder dev code (${DEV_FALLBACK_CODE}). ` +
        "Set it in .env.local before shipping to real customers.",
    );
    code = DEV_FALLBACK_CODE;
  }

  const codeHash = await sha256Hex(normalizeAccessCode(code));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "access.json"), JSON.stringify({ codeHash }, null, 2));

  if (!existsSync(join(ROOT, ".env.local"))) {
    writeFileSync(
      join(ROOT, ".env.local"),
      `# One static access code for the whole product - see scripts/build-access-code.ts\n` +
        `# Change this, then re-run "npm run dev" or "npm run build" to regenerate the hash.\n` +
        `SCHOLARSHIP_QUEST_ACCESS_CODE=${DEV_FALLBACK_CODE}\n`,
    );
    console.log(".env.local created with a placeholder access code - edit it before shipping.");
  }

  console.log("Access code hash generated ->", join(OUT_DIR, "access.json"));
}

main();
