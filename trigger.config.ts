// trigger.config.ts
// Place this file at the ROOT of your project (same level as package.json)
// Docs: https://trigger.dev/docs/config/config-file
//
// SETUP STEPS:
//   1. npx trigger.dev@latest login
//   2. npx trigger.dev@latest init   (creates project + fills TRIGGER_PROJECT_ID)
//   3. npx trigger.dev@latest dev    (local dev — watches src/agents/)
//   4. npx trigger.dev@latest deploy (production — independent of Vercel)

import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // Your Trigger.dev project ID — get from trigger.dev dashboard
  // Or run: npx trigger.dev@latest init
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_imr_change_me",

  // Where Trigger.dev looks for task files
  // Every file inside this folder that exports a task/schedule is auto-registered
  dirs: ["./src/agents"],

  // Max duration for any single task run (seconds)
  // Agent pipeline can run up to 15 min (reactions + GPT + publish)
  maxDuration: 900,

  // Retry config — applied to all tasks unless overridden per-task
  retries: {
    enabledInDev: false,        // don't retry during local dev
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 2_000,    // 2s initial backoff
      maxTimeoutInMs: 30_000,   // cap at 30s
      factor: 2,                // exponential: 2s → 4s → 8s
      randomize: true,          // jitter prevents thundering herd
    },
  },

  // Build config — runs BEFORE deploy to tree-shake and bundle correctly
  build: {
    // External packages that should NOT be bundled (use native node_modules)
    // Add any packages that have native binaries or can't be bundled
    external: ["sharp"],
  },
});