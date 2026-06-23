import { createTask } from "./commands/create-task";
import { init } from "./commands/init";
import { serve } from "./commands/serve";
import { update } from "./commands/update";
import { version } from "./commands/version";

function help(): void {
  console.log(`
AILoveCode Workflow

Usage:

  npx ailovecode-workflow init
  npx ailovecode-workflow update
  npx ailovecode-workflow create-task "task name"
  npx ailovecode-workflow serve
  npx ailovecode-workflow version

Aliases:

  npx ailovecode-workflow install
`);
}

export async function main(): Promise<void> {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case "init":
    case "install":
      init();
      break;

    case "update":
      update();
      break;

    case "create-task":
      createTask(args);
      break;

    case "serve":
      await serve();
      break;

    case "version":
    case "--version":
    case "-v":
      version();
      break;

    case undefined:
    case "help":
    case "--help":
    case "-h":
      help();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      help();
      process.exit(1);
  }
}
