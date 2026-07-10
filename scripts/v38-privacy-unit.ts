/**
 * Unit checks for privacy-access rules (launch matrix subset).
 * Run: npx tsx scripts/v38-privacy-unit.ts
 */
import { canViewerSeeActivity } from "../src/lib/privacy-access";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean) {
  if (cond) {
    console.log(`PASS: ${name}`);
    passed += 1;
  } else {
    console.log(`FAIL: ${name}`);
    failed += 1;
  }
}

// Stranger never sees PRIVATE activity
assert(
  "stranger PRIVATE activity denied",
  !canViewerSeeActivity("u2", "u1", "PRIVATE", "TASK_COMPLETED", false, null),
);

// Friend sees FRIENDS diary activity when diaryScope full
assert(
  "friend FRIENDS TASK_COMPLETED allowed (full diary)",
  canViewerSeeActivity("u2", "u1", "FRIENDS", "TASK_COMPLETED", true, {
    diaryScope: "full",
    defaultDiary: "PRIVATE",
  }),
);

// Stranger does not see FRIENDS task activity
assert(
  "stranger FRIENDS TASK_COMPLETED denied",
  !canViewerSeeActivity("u2", "u1", "FRIENDS", "TASK_COMPLETED", false, {
    diaryScope: "full",
    defaultDiary: "PRIVATE",
  }),
);

// Owner always sees own
assert(
  "owner always sees",
  canViewerSeeActivity("u1", "u1", "PRIVATE", "TASK_COMPLETED", false, null),
);

// Achievement hidden when defaultDiary PRIVATE for non-owner
assert(
  "stranger achievement hidden when defaultDiary PRIVATE",
  !canViewerSeeActivity("u2", "u1", "PUBLIC", "ACHIEVEMENT_UNLOCKED", false, {
    diaryScope: "public_only",
    defaultDiary: "PRIVATE",
  }),
);

console.log(`=== privacy unit: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
