/**
 * Run the nightly generation job locally (same logic the cron endpoint calls).
 *
 *   npm run cron:nightly
 *
 * In production this runs on a schedule — see docs/ARCHITECTURE.md.
 */
import "dotenv/config";
import { runNightly } from "../src/lib/nightly";

async function main() {
  const result = await runNightly({ deliverEmail: false });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
