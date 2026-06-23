#!/usr/bin/env node

const { main } = require("../dist/cli");

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
