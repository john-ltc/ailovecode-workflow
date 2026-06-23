"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const create_task_1 = require("./commands/create-task");
const init_1 = require("./commands/init");
const serve_1 = require("./commands/serve");
const update_1 = require("./commands/update");
const version_1 = require("./commands/version");
function help() {
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
async function main() {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    switch (command) {
        case "init":
        case "install":
            (0, init_1.init)();
            break;
        case "update":
            (0, update_1.update)();
            break;
        case "create-task":
            (0, create_task_1.createTask)(args);
            break;
        case "serve":
            await (0, serve_1.serve)();
            break;
        case "version":
        case "--version":
        case "-v":
            (0, version_1.version)();
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
